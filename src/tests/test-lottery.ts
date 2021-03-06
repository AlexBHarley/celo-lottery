import { toWei } from "web3-utils";
import { Address, newKit } from "@celo/contractkit";
import { BigNumber } from "bignumber.js";
import {
	increaseTime,
	Provider,
	increaseBlocks,
} from "celo-devchain/dist/utils";
import { LotteryKit } from "../lotterykit";
import { Deposited } from "../../types/truffle-contracts/CeloLottery";
import { LotteryManagerInstance } from "../../types/truffle-contracts/LotteryManager";
import { LotteryInstance } from "../../types/truffle-contracts/Lottery";
import { LotteryTokenInstance } from "../../types/truffle-contracts/LotteryToken";
import { createAccounts } from "./utils";

import { SavingsCELO, SavingsKit } from "savingscelo";

const LotteryManager = artifacts.require("LotteryManager");
const LotteryToken = artifacts.require("LotteryToken");
const Lottery = artifacts.require("Lottery");

const ONE_MINUTE = 12;
const ONE_HOUR = ONE_MINUTE * 12;
const ONE_DAY = ONE_HOUR * 24;

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

	let lotteryManager: LotteryManagerInstance;
	let savingsKit: SavingsKit;
	let lotteryKit: LotteryKit;

	before(async () => {
		lotteryManager = await LotteryManager.new(
			"0x000000000000000000000000000000000000ce10"
		);
		lotteryKit = new LotteryKit(kit, lotteryManager.address);
	});

	it(`create accounts`, async () => {
		[one, two, three] = await createAccounts(kit, owner, [
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
			new BigNumber(toWei("1", "ether")).plus(depositAmount).toFixed(0),
		]);
	});

	it("creates lotteries", async () => {
		expect(await lotteryManager.getLotteries()).to.have.lengthOf(0);

		await lotteryManager.create("TestLottery", ONE_HOUR, ONE_HOUR, {
			from: one,
		});
		expect(await lotteryManager.getLotteries()).to.have.lengthOf(1);
	});

	it(`allows deposits into the lottery`, async () => {
		const [lotteryAddress] = await lotteryManager.getLotteries();
		const lotteryInstance = await Lottery.at(lotteryAddress);

		const lotteryTokenAddress = await lotteryManager.getLotteryTokenAddress();
		const lotteryTokenInstance = await LotteryToken.at(lotteryTokenAddress);

		const goldToken = await kit.contracts.getGoldToken();
		await goldToken
			.increaseAllowance(lotteryInstance.address, depositAmount)
			.sendAndWaitForReceipt({ from: one } as any);

		const res = await lotteryInstance.deposit(depositAmount, { from: one });
		const eventDeposited = res.logs.pop() as Truffle.TransactionLog<Deposited>;
		assert.equal(eventDeposited.event, "Deposited");
		assert.equal(eventDeposited.args.from, one);
		assert.equal(eventDeposited.args.amount.toString(), depositAmount);

		const depositedOne = (await lotteryInstance.getDepositsForAddress(
			one
		)) as any;
		assert.isTrue(depositedOne.eq(eventDeposited.args.amount));
		assert.isTrue(depositedOne.toString() === depositAmount);

		const totalDeposited = (await lotteryInstance.getTotalDeposited()) as any;
		assert.isTrue(totalDeposited.toString() === depositAmount);

		const balanceOne = await goldToken.balanceOf(one);
		assert.isTrue(balanceOne.lt(toWei("1", "ether")));

		const tickets = await lotteryTokenInstance.balanceOf(one);
		assert.isTrue(totalDeposited.eq(tickets));
	});

	it("executing fails before round is over", async () => {
		const [lotteryAddress] = await lotteryManager.getLotteries();
		const lotteryInstance = await Lottery.at(lotteryAddress);

		try {
			await lotteryInstance.execute();
			assert.fail("Executing should have failed");
		} catch (e) {
			assert.isTrue(e.reason === "Round is not finished yet");
		}
	});

	it("executing after time elapsed succeeds", async () => {
		await increaseBlocks(kit.web3.currentProvider as Provider, ONE_DAY + 1);

		const [lotteryAddress] = await lotteryManager.getLotteries();
		const lotteryInstance = await Lottery.at(lotteryAddress);

		try {
			await lotteryInstance.execute();
		} catch (e) {
			console.log("e");
			assert.fail(e.message || e.reason);
		}
	});
});
