import { Address, ContractKit } from "@celo/contractkit";
import { toTransactionObject } from "@celo/connect";
import { PendingWithdrawal } from "@celo/contractkit/lib/wrappers/LockedGold";

import BigNumber from "bignumber.js";
import { SavingsCelo } from "../types/web3-v1-contracts/SavingsCELO";

import CeloLotteryJson from "../build/contracts/CeloLottery.json";
import { SavingsKit } from "savingscelo";

/**
 * SavingsKit provides wrappers to interact with SavingsCELO contract.
 * For operations that may not be exposed through wrappers, internal .contract object can
 * be used directly. See implementation of .deposit() wrapper as an example.
 */
export class LotteryKit {
	public readonly contract: SavingsCelo;
	public readonly savingsKit: SavingsKit;

	constructor(
		private kit: ContractKit,
		public readonly savingsCeloContractAddress: Address,
		public readonly lotterycontractAddress: Address
	) {
		this.savingsKit = new SavingsKit(kit, savingsCeloContractAddress);

		this.contract = (new kit.web3.eth.Contract(
			CeloLotteryJson.abi as any,
			lotterycontractAddress
		) as unknown) as SavingsCelo;
	}

	public deposit = (celoAmount: BigNumber.Value) => {
		const txo = this.contract.methods.deposit(
			new BigNumber(celoAmount).toFixed(0)
		);
		return toTransactionObject(this.kit.connection, txo);
	};

	public withdrawStart = async (celo: BigNumber.Value) => {
		const savingsAmounts = await this.savingsKit.contract.methods
			.celoToSavings(celo.toString())
			.call();
		await (
			await this.savingsKit.withdrawStart(savingsAmounts)
		).sendAndWaitForReceipt();
	};

	public withdrawFinish = async (from: Address) => {
		const pendings = await this.savingsKit.pendingWithdrawals(from);

		try {
			await (
				await this.savingsKit.withdrawFinish(pendings, 0)
			).sendAndWaitForReceipt({ from });
			assert.fail("withdraw must fail since not enough time has passed!");
		} catch {}
	};
}
