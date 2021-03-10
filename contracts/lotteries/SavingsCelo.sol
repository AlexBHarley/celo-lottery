pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "sortition-sum-tree-factory/contracts/SortitionSumTreeFactory.sol";

import "../celo/identity/interfaces/IRandom.sol";
import "../celo/common/interfaces/IGoldToken.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/ISavingsCELO.sol";

import "../LotteryToken.sol";


contract SavingsCeloLottery {
	using SafeMath for uint256;
  using SortitionSumTreeFactory for SortitionSumTreeFactory.SortitionSumTrees;

	IRegistry constant _registry = IRegistry(address(0x000000000000000000000000000000000000ce10));
	IGoldToken public _goldToken;
	IRandom public _random;
	ISavingsCELO public _savingsCelo;
	address _savingsCeloAddress;
	LotteryToken public _tickets;

	string _name;
	uint256 _createdBlockNumber;
	uint256 _activeDurationBlocks;
	uint256 _claimDurationBlocks;

	mapping(address => uint256) pendingWithdrawals;
	mapping(address => uint256) deposits;
	uint256 playerCount;
	uint256 totalDeposited;

	SortitionSumTreeFactory.SortitionSumTrees internal sortitionSumTrees;
  bytes32 constant private TREE_KEY = keccak256("CeloLottery/Ticket");

	event Deposited(address indexed from, uint256 amount);
	event Withdrew(address indexed from, uint256 amount);
	event Log(uint256 data);

	constructor (
		string memory name,
		uint256 activeDurationBlocks,
		uint256 claimDurationBlocks,

		address lotteryTokenAddress,
		address savingsCeloAddress,
		address randomAddress
	) public {
		_tickets = LotteryToken(lotteryTokenAddress);
		_savingsCelo = ISavingsCELO(savingsCeloAddress);
		_savingsCeloAddress = savingsCeloAddress;
		_goldToken = IGoldToken(_registry.getAddressForStringOrDie("GoldToken"));
		_random = IRandom(randomAddress); // (_registry.getAddressForStringOrDie("Random"));

		sortitionSumTrees.createTree(
			TREE_KEY,
			5
		);

		_name = name;
		_createdBlockNumber = block.number;
		_activeDurationBlocks = activeDurationBlocks;
		_claimDurationBlocks = claimDurationBlocks;
	}

	function deposit(uint256 amount) external {
		_tickets.mint(msg.sender, amount);
		deposits[msg.sender] += amount;
		totalDeposited += amount;
		
		sortitionSumTrees.set(TREE_KEY, _tickets.balanceOf(msg.sender), bytes32(uint256(msg.sender)));
		
		require(
			_goldToken.transferFrom(msg.sender, address(this), amount),
			"CELO transfer failed"
		);
		_goldToken.increaseAllowance(_savingsCeloAddress, amount);
		_savingsCelo.deposit(amount);

		emit Deposited(msg.sender, amount);
	}

	function withdraw (uint256 amount) external {
		require(deposits[msg.sender] > amount, "Not enough balance");

		_tickets.burn(msg.sender, amount);
		deposits[msg.sender] -= amount;
		totalDeposited -= amount;

		sortitionSumTrees.set(TREE_KEY, _tickets.balanceOf(msg.sender), bytes32(uint256(msg.sender)));
		emit Withdrew(msg.sender, amount);

		msg.sender.transfer(amount);
	}

	function getUniformRandomNumber(uint256 _entropy, uint256 _upperBound) internal pure returns (uint256) {
    require(_upperBound > 0, "UniformRand/min-bound");
    uint256 min = -_upperBound % _upperBound;
    uint256 random = _entropy;
    while (true) {
      if (random >= min) {
        break;
      }
      random = uint256(keccak256(abi.encodePacked(random)));
    }
    return random % _upperBound;
  }

	function execute () external {
		uint256 currentBlock = block.number;
		uint256 createdBlock = _createdBlockNumber;

 		uint256 currentRound = (currentBlock - createdBlock) / (_activeDurationBlocks + _claimDurationBlocks);
		uint256 startCurrentRound = createdBlock + currentRound * (_activeDurationBlocks + _claimDurationBlocks);
		uint256 endCurrentActive = startCurrentRound + _activeDurationBlocks;

		require(currentBlock > endCurrentActive, "Round is not finished yet");
		
		uint256 randomSeed = uint256(_random.random());
		uint256 uniformRandomNumber = getUniformRandomNumber(randomSeed, totalDeposited);

    address selected = address(uint256(sortitionSumTrees.draw(TREE_KEY, uniformRandomNumber)));
		if (selected == address(0)) {
			return;
		}

		uint256 totalSavingsCelo = _savingsCelo.balanceOf(address(this));
		uint256 totalCelo = _savingsCelo.savingsToCELO(totalSavingsCelo);
		uint256 rewardAmount = totalCelo.sub(totalDeposited);

		_tickets.mint(selected, rewardAmount);
	}
	
  function chanceOf(address user) external view returns (uint256) {
    return sortitionSumTrees.stakeOf(TREE_KEY, bytes32(uint256(user)));
  }

	function getTotalDeposited () external view returns (uint256) {
		return totalDeposited;
	}

	function getDepositsForAddress (address account) external view returns (uint256) {
		return deposits[account];
	}

	function withdrawStart(
		uint256 celoAmount,
		address lesserAfterPendingRevoke,
		address greaterAfterPendingRevoke,
		address lesserAfterActiveRevoke,
		address greaterAfterActiveRevoke
	) external {
		require(deposits[msg.sender] >= celoAmount);

		deposits[msg.sender] -= celoAmount;
		pendingWithdrawals[msg.sender] += celoAmount;
		_tickets.burn(msg.sender, celoAmount);

		uint256 savingsCeloAmount = _savingsCelo.celoToSavings(celoAmount);
		_savingsCelo.withdrawStart(
			savingsCeloAmount, 
			lesserAfterPendingRevoke, 
			greaterAfterPendingRevoke, 
			lesserAfterActiveRevoke, 
			greaterAfterActiveRevoke
		);
	}

	function withdrawFinish(uint256 index, uint256 indexGlobal) external {
		require(pendingWithdrawals[msg.sender] > 0);
		
		uint256 amount = pendingWithdrawals[msg.sender];

		pendingWithdrawals[msg.sender] = 0;
		_savingsCelo.withdrawFinish(index, indexGlobal);
		_goldToken.transfer(address(this), amount);
	}
}