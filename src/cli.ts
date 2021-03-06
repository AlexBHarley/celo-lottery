#!/usr/bin/env node
import { toWei } from "web3-utils";
import { program } from "commander";
import BigNumber from "bignumber.js";
import { ContractKit, newKit } from "@celo/contractkit";
import {
	AddressValidation,
	newLedgerWalletWithSetup,
} from "@celo/wallet-ledger";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { toTransactionObject } from "@celo/connect";

import { LotteryKit } from "./lotterykit";

import alfajoresSavingsCELO from "./deploy/alfajores.SavingsCELO.addr.json";
import baklavaSavingsCELO from "./deploy/baklava.SavingsCELO.addr.json";
import { fmtValue, sendTX } from "./cli-utils";

process.on("unhandledRejection", (reason, _promise) => {
	// @ts-ignore
	console.error("Unhandled Rejection at:", reason.stack || reason);
	process.exit(0);
});

program
	.option(
		"-n --network <url>",
		"Celo network to connect to",
		"https://forno.celo.org"
	)
	.option("-f --from <address>", "Account address")
	.option(
		"-i --ledger-idx <index>",
		"If provided, will use account from a Ledger hardware wallet. " +
			"Uses standard celo address derivation path of: \"44'/52752'/0'/0\""
	);

async function initKit() {
	const opts = program.opts();
	if (opts.from !== undefined && opts.ledgerIdx !== undefined) {
		console.error(`Only one of --from or --ledger-idx flags can be used!`);
		process.exit(1);
	}
	let fromAddr = opts.from;
	let wallet;
	if (opts.ledgerIdx !== undefined) {
		try {
			const transport = await TransportNodeHid.open("");
			wallet = await newLedgerWalletWithSetup(
				transport,
				[Number.parseInt(opts.ledgerIdx)],
				undefined,
				AddressValidation.never
			);
		} catch (e) {
			console.error(
				`Check if the Ledger is connected and if the Celo app is open!`
			);
			process.exit(1);
		}
		fromAddr = wallet.getAccounts()[0];
		console.info(`Ledger Account: ${fromAddr}`);
	}
	const kit = newKit(opts.network, wallet);
	kit.defaultAccount = fromAddr;
	const networkId = await kit.web3.eth.getChainId();
	let contractAddr;
	switch (networkId) {
		case 1337:
			contractAddr = require("./deploy/ganache.SavingsCELO.addr.json").address;
			break;
		case 44787:
			contractAddr = alfajoresSavingsCELO.address;
			break;
		case 62320:
			contractAddr = baklavaSavingsCELO.address;
			break;
		default:
			throw new Error(`Unsupport networkId: ${networkId}`);
	}
	const lotteryKit = new LotteryKit(kit, contractAddr);
	return { kit, lotteryKit };
}

program
	.command("deposit <amount>")
	.description("Deposit CELO to SavingsCELO contract")
	.action(async (value: string) => {
		const { kit, lotteryKit } = await initKit();
		const approveTX = await lotteryKit.infiniteApprove(kit.defaultAccount!);
		if (approveTX) {
			await sendTX("APPROVE SavingsCELO", approveTX);
		}
		const toDeposit = toWei(value, "ether");
		await sendTX(`DEPOSIT: ${value} CELO`, lotteryKit.deposit(toDeposit));
	});

async function printPendingWithdrawals(
	kit: ContractKit,
	lotteryKit: LotteryKit
) {
	const pendings = await lotteryKit.pendingWithdrawals(kit.defaultAccount!);
	if (pendings.length === 0) {
		console.info(`No pending withdrawals.`);
	} else {
		console.info(`Pending Withdrawals:`);
		for (let idx = 0; idx < pendings.length; idx += 1) {
			const pending = pendings[idx];
			const timestamp = new Date(pending.time.multipliedBy(1000).toNumber());
			console.info(`${idx}:`);
			console.info(`  ready: ${timestamp.toLocaleString()}`);
			console.info(`  value: ${fmtValue(pending.value)} CELO`);
		}
	}
}

program
	.command("balance")
	.description("Display SavingsCELO balance, and pending withdrawals")
	.action(async () => {
		const { kit, lotteryKit } = await initKit();
		const goldToken = await kit.contracts.getGoldToken();
		const celoBalance = await goldToken.balanceOf(kit.defaultAccount!);
		const savingsBalance = await lotteryKit.contract.methods
			.balanceOf(kit.defaultAccount!)
			.call();
		const savingsAsCELO = await lotteryKit.contract.methods
			.savingsToCELO(savingsBalance)
			.call();
		console.info(`CELO:        ${fmtValue(celoBalance)} CELO`);
		console.info(
			`SavingsCELO: ~${fmtValue(savingsAsCELO, 2)} CELO (${fmtValue(
				savingsBalance
			)} SavingsCELO)`
		);
		printPendingWithdrawals(kit, lotteryKit);
	});

program
	.command("transfer")
	.option("--to <address>", "Address to transfer SavingsCELO tokens to")
	.option(
		"--amount <amount>",
		"Amount to transfer given in CELO. To transfer all tokens use 'all' as amount"
	)
	.description("Transfer SavingsCELO tokens to another address")
	.action(async (opts) => {
		if (!opts.to) {
			console.error(`Must provide destination address using --to flag.`);
			process.exit(1);
		}
		if (!opts.amount) {
			console.error(`Must provide amount to transfer using --amount flag.`);
			process.exit(1);
		}
		const { kit, lotteryKit } = await initKit();
		let toTransfer;
		if (opts.amount.toLowerCase() === "all") {
			toTransfer = await lotteryKit.contract.methods
				.balanceOf(kit.defaultAccount!)
				.call();
		} else {
			toTransfer = await lotteryKit.contract.methods
				.celoToSavings(toWei(opts.amount as string, "ether"))
				.call();
		}
		const txo = toTransactionObject(
			kit.connection,
			lotteryKit.contract.methods.transfer(opts.to, toTransfer)
		);
		await sendTX(
			`TRANSFER: ~${opts.amount} CELO ` +
				`(${new BigNumber(toTransfer).div(1e18).toString()} SavingsCELO) => ${
					opts.to
				}`,
			txo
		);
	});

program
	.command("withdraw <amount>")
	.description(
		"Start withdraw process for given CELO <amount> worth of SavingsCELO tokens. " +
			"Can use 'all' as <amount> to withdraw all SavingsCELO tokens"
	)
	.action(async (value: string) => {
		const { kit, lotteryKit } = await initKit();
		let toWithdraw;
		if (value.toLowerCase() === "all") {
			toWithdraw = await lotteryKit.contract.methods
				.balanceOf(kit.defaultAccount!)
				.call();
		} else {
			toWithdraw = await lotteryKit.contract.methods
				.celoToSavings(toWei(value, "ether"))
				.call();
		}
		await sendTX(
			`WITHDRAW: ${value} CELO`,
			await lotteryKit.withdrawStart(toWithdraw)
		);
		printPendingWithdrawals(kit, lotteryKit);
	});

program
	.command("withdraw:cancel <index>")
	.description("Cancel withdraw process")
	.action(async (index: string) => {
		const { kit, lotteryKit } = await initKit();
		const pendings = await lotteryKit.pendingWithdrawals(kit.defaultAccount!);
		await sendTX(
			`WITHDRAW:CANCEL ${index}`,
			await lotteryKit.withdrawCancel(pendings, Number.parseInt(index))
		);
	});

program
	.command("withdraw:finish <index>")
	.description("Finish withdraw process")
	.action(async (index: string) => {
		const { kit, lotteryKit } = await initKit();
		const pendings = await lotteryKit.pendingWithdrawals(kit.defaultAccount!);
		const idx = Number.parseInt(index);
		const pendingReady = new Date(
			pendings[idx].time.multipliedBy(1000).toNumber()
		);
		if (pendingReady > new Date()) {
			console.error(
				`Pending withdrawal not yet ready! Available on: ${pendingReady.toLocaleString()}`
			);
			process.exit(1);
		}
		await sendTX(
			`WITHDRAW:FINISH ${index}`,
			await lotteryKit.withdrawFinish(pendings, idx)
		);
	});

program
	.command("contracts")
	.description("Display addresses for SavingsCELO contracts")
	.action(async () => {
		const { kit, lotteryKit } = await initKit();
		const voterAddr = await lotteryKit.contract.methods._voter().call();
		console.info(`SavingsCELO       :`, lotteryKit.contractAddress);
		console.info(`SavingsCELO _voter:`, voterAddr);
	});

async function main() {
	await program.parseAsync(process.argv);
}
main();
