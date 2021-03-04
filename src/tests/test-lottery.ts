import { toWei } from "web3-utils";
import { Address, newKit } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import { increaseTime, Provider } from "celo-devchain";
import { LotteryKit } from "../lotterykit";
import {
	Deposited,
	CeloLotteryInstance,
} from "../../types/truffle-contracts/CeloLottery";
import { createAccounts } from "./utils";

import { SavingsCELO, SavingsKit } from "savingscelo";

const CeloLottery = artifacts.require("CeloLottery");

const kit = newKit("http://127.0.0.1:7545");
after(() => {
	kit.stop();
});
contract("CeloLottery - Deposits", (accounts) => {
	const owner = accounts[0];

	let one: Address;
	let two: Address;
	let three: Address;

	const depositAmount = toWei("10", "ether");

	let celoLottery: CeloLotteryInstance;
	let savingsKit: SavingsKit;
	let lotteryKit: LotteryKit;

	before(async () => {
		celoLottery = await CeloLottery.new(
			"0x000000000000000000000000000000000000ce10"
		);
		lotteryKit = new LotteryKit(kit, celoLottery.address);
	});

	it(`create accounts`, async () => {
		[one, two, three] = await createAccounts(kit, owner, [
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
		]);
	});

	it(`deposits CELO`, async () => {
		const goldToken = await kit.contracts.getGoldToken();

		await goldToken
			.increaseAllowance(celoLottery.address, depositAmount)
			.sendAndWaitForReceipt({ from: one } as any);

		const res = await celoLottery.deposit(depositAmount, { from: one });
		const eventDeposited = res.logs.pop() as Truffle.TransactionLog<Deposited>;
		assert.equal(eventDeposited.event, "Deposited");
		assert.equal(eventDeposited.args.from, one);
		assert.equal(eventDeposited.args.amount.toString(), depositAmount);

		const depositedOne = (await celoLottery.getDepositsForAddress(one)) as any;
		assert.isTrue(depositedOne.eq(eventDeposited.args.amount));
		assert.isTrue(depositedOne.eq(depositAmount));

		const totalDeposited = (await celoLottery.getTotalDeposited()) as any;
		assert.isTrue(totalDeposited.eq(depositAmount));

		const balanceOne = await goldToken.balanceOf(one);
		assert.isTrue(balanceOne.lt(toWei("1", "ether")));
	});
});

export {};
