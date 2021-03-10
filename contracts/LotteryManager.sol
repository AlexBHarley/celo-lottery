pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "sortition-sum-tree-factory/contracts/SortitionSumTreeFactory.sol";

import "./celo/identity/interfaces/IRandom.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/ISavingsCELO.sol";

import "./LotteryToken.sol";
import "./lotteries/MoolaMarket.sol";
import "./lotteries/SavingsCelo.sol";
import "./lotteries/Ubeswap.sol";


contract LotteryManager {
	address[] public _savingsCeloLotteries;
	address[] public _moolaMarketLotteries;
	address[] public _ubeswapLotteries;

	event Created(address indexed from, address indexed lottery, string t);

	address _lotteryTokenAddress;
	address _savingsCeloAddress;
	address _randomAddress;
	
	constructor (
		address savingsCeloAddress,
		address randomAddress
	) public {
		_lotteryTokenAddress = address(new LotteryToken());
		_savingsCeloAddress = savingsCeloAddress;
		_randomAddress = randomAddress;
	}

	function createSavingsCeloLottery (
		string memory name, 
		uint256 activeDurationBlocks, 
		uint256 claimDurationBlocks
	) public returns (address) {
		address lotteryAddress = address(
			new SavingsCeloLottery(
				name, 
				activeDurationBlocks, 
				claimDurationBlocks,
				_lotteryTokenAddress, 
				_savingsCeloAddress,
				_randomAddress
			)
		);

		_savingsCeloLotteries.push(lotteryAddress);
		emit Created(msg.sender, lotteryAddress, "SavingsCelo");
		LotteryToken(_lotteryTokenAddress).approveMinting(lotteryAddress);

		return lotteryAddress;
	}

	function getLotteries () external view returns (address[] memory, address[] memory, address[] memory) {
		return (_savingsCeloLotteries, _moolaMarketLotteries, _ubeswapLotteries);
	}

	function getLotteryTokenAddress () external view returns (address) {
		return _lotteryTokenAddress;
	}
}