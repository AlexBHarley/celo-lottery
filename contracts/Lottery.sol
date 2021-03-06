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


contract Lottery {
	using SafeMath for uint256;
  using SortitionSumTreeFactory for SortitionSumTreeFactory.SortitionSumTrees;

  SortitionSumTreeFactory.SortitionSumTrees internal sortitionSumTrees;

	IRegistry constant _registry = IRegistry(address(0x000000000000000000000000000000000000ce10));
	IERC20 public _goldToken;
	IRandom public _random;
	ISavingsCELO public _savingsCelo;
	LotteryToken public _tickets;

	string _name;
	uint256 _createdBlockNumber;
	uint256 _activeDurationBlocks;
	uint256 _claimDurationBlocks;

	mapping(address => uint256) deposits;

	uint256 playerCount;
	uint256 totalDeposited;

	event Deposited(address indexed from, uint256 amount);
	event Withdrew(address indexed from, uint256 amount);

  bytes32 constant private TREE_KEY = keccak256("CeloLottery/Ticket");

	constructor (
		string memory name,
		uint256 activeDurationBlocks,
		uint256 claimDurationBlocks,

		address lotteryTokenAddress,
		address savingsCeloAddress
	) public {
		_tickets = LotteryToken(lotteryTokenAddress);
		_savingsCelo = ISavingsCELO(savingsCeloAddress);
		_goldToken = IERC20(_registry.getAddressForStringOrDie("GoldToken"));
		_random = IRandom(_registry.getAddressForStringOrDie("Random"));

		sortitionSumTrees.createTree(
			keccak256(abi.encodePacked("CeloLottery", "/", name)), 
			5
		);

		_name = name;
		_createdBlockNumber = block.number;
		_activeDurationBlocks = activeDurationBlocks;
		_claimDurationBlocks = claimDurationBlocks;
	}

	function deposit(uint256 amount) external {
		deposits[msg.sender] += amount;
		totalDeposited += amount;
		if (deposits[msg.sender] == 0) {
			playerCount += 1;
		}

		require(
			_goldToken.transferFrom(msg.sender, address(this), amount),
			"CELO transfer failed"
		);
		_tickets.mint(msg.sender, amount);
		
		emit Deposited(msg.sender, amount);
	}

	function withdraw (uint256 amount) external {
		require(
			deposits[msg.sender] >= amount, 
			"Invalid balance"
		);

		deposits[msg.sender] -= amount;
		totalDeposited -= amount;
		if (deposits[msg.sender] - amount == 0) {
			playerCount -= 1;
		} 

		_tickets.burn(msg.sender, amount);
		msg.sender.transfer(amount);
		emit Withdrew(msg.sender, amount);
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

		uint256 rewardAmount = _savingsCelo.balanceOf(selected) - totalDeposited;
		_tickets.mint(selected, rewardAmount);
	}

	function getTotalDeposited () external view returns (uint256) {
		return totalDeposited;
	}

	function getDepositsForAddress (address account) external view returns (uint256) {
		return deposits[account];
	}
}