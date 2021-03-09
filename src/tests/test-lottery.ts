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
import {
	RandomTestContract,
	RandomTestInstance,
} from "../../types/truffle-contracts/RandomTest";
import { createAccounts } from "./utils";

import { newRandom, Random } from "@celo/contractkit/lib/generated/Random";

import { SavingsKit, SavingsCELO } from "savingscelo";
import {
	SavingsCELOContract,
	SavingsCELOInstance,
} from "../../types/truffle-contracts";

const LotteryManager = artifacts.require("LotteryManager");
const LotteryToken = artifacts.require("LotteryToken");
const Lottery = artifacts.require("Lottery");
const Random: RandomTestContract = artifacts.require("RandomTest");
const SavingsCELO = artifacts.require("SavingsCELO");

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
	let random: RandomTestInstance;

	const depositAmount = toWei("10", "ether");

	let lotteryManager: LotteryManagerInstance;
	let lottery: LotteryInstance;
	let savingsKit: SavingsKit;
	let savingsCelo: SavingsCELOInstance;
	let lotteryKit: LotteryKit;

	before(async () => {
		random = await Random.new();
		await random.initialize(256);

		savingsCelo = await SavingsCELO.new();

		lotteryManager = await LotteryManager.new(
			savingsCelo.address,
			random.address
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

		const lotteries = await lotteryManager.getLotteries();
		expect(lotteries).to.have.lengthOf(1);

		lottery = await Lottery.at(lotteries[0]);
	});

	it(`allows deposits into the lottery`, async () => {
		const lotteryTokenAddress = await lotteryManager.getLotteryTokenAddress();
		const lotteryTokenInstance = await LotteryToken.at(lotteryTokenAddress);

		const goldToken = await kit.contracts.getGoldToken();
		await goldToken
			.increaseAllowance(lottery.address, depositAmount)
			.sendAndWaitForReceipt({ from: one } as any);

		const res = await lottery.deposit(depositAmount, { from: one });
		const eventDeposited = res.logs.pop() as Truffle.TransactionLog<Deposited>;
		assert.equal(eventDeposited.event, "Deposited");
		assert.equal(eventDeposited.args.from, one);
		assert.equal(eventDeposited.args.amount.toString(), depositAmount);

		const depositedOne = (await lottery.getDepositsForAddress(one)) as any;

		assert.isTrue(depositedOne.eq(eventDeposited.args.amount));
		assert.isTrue(depositedOne.toString() === depositAmount);

		const balanceOne = await goldToken.balanceOf(one);
		assert.isTrue(balanceOne.lt(toWei("1", "ether")));

		const tickets = (await lotteryTokenInstance.balanceOf(one)) as any;
		assert.isTrue(new BigNumber(depositAmount).eq(tickets));
	});

	it("correctly calculates likelyhood of winning", async () => {
		const chanceOfOne = await lottery.chanceOf(one);
		expect(chanceOfOne.toString()).to.equal(depositAmount);

		const goldToken = await kit.contracts.getGoldToken();
		await goldToken
			.increaseAllowance(lottery.address, depositAmount)
			.sendAndWaitForReceipt({ from: two } as any);
		await lottery.deposit(depositAmount, { from: two });

		const chanceOfTwo = await lottery.chanceOf(two);
		expect(chanceOfTwo.toString()).to.equal(depositAmount);

		const calcuatedTotal = chanceOfOne.add(chanceOfTwo);
		const total = await lottery.getTotalDeposited();
		expect(calcuatedTotal.eq(total)).to.equal(true);

		console.log(chanceOfOne.toString(), chanceOfTwo.toString());
	});

	it("executing fails before round is over", async () => {
		const [lotteryAddress] = await lotteryManager.getLotteries();
		const lottery = await Lottery.at(lotteryAddress);

		try {
			await lottery.execute();
			assert.fail("Executing should have failed");
		} catch (e) {
			assert.isTrue(e.reason === "Round is not finished yet");
		}
	});

	it("executing after time elapsed succeeds", async () => {
		const lastBlock = await kit.web3.eth.getBlockNumber();
		await random.addTestRandomness(lastBlock - 2, "0x01");
		await random.addTestRandomness(lastBlock - 1, "0x02");
		await random.addTestRandomness(lastBlock - 0, "0x03");

		await increaseBlocks(kit.web3.currentProvider as Provider, ONE_HOUR + 1);

		try {
			await lottery.execute();
		} catch (e) {
			assert.fail(e.message || e.reason);
		}
	});
});
