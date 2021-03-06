pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "sortition-sum-tree-factory/contracts/SortitionSumTreeFactory.sol";

import "./interfaces/IRandom.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/ISavingsCELO.sol";

import "./LotteryToken.sol";
import "./Lottery.sol";


contract LotteryManager {
	address[] public _lotteries;

	event Created(address indexed from, address indexed lottery);

	address _lotteryTokenAddress;
	address _savingsCeloAddress;

	constructor (
		address savingsCeloAddress
	) public {
		_lotteryTokenAddress = address(new LotteryToken());
		_savingsCeloAddress = savingsCeloAddress;
	}

	function create (string memory name, uint256 activeDurationBlocks, uint256 claimDurationBlocks) public returns (address) {
		address lotteryAddress = address(
			new Lottery(
				name, 
				activeDurationBlocks, 
				claimDurationBlocks,
				_lotteryTokenAddress, 
				_savingsCeloAddress
			)
		);

		_lotteries.push(lotteryAddress);
		emit Created(msg.sender, lotteryAddress);
		
		LotteryToken(_lotteryTokenAddress).approveMinting(lotteryAddress);

		return lotteryAddress;
	}

	function getLotteries () external view returns (address[] memory) {
		return _lotteries;
	}

	function getLotteryTokenAddress () external view returns (address) {
		return _lotteryTokenAddress;
	}
}