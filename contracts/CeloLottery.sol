pragma solidity 0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IRegistry.sol";
import "./interfaces/ISavingsCELO.sol";


contract CeloLottery {
	using SafeMath for uint256;

	IRegistry constant _registry = IRegistry(address(0x000000000000000000000000000000000000ce10));
	IERC20 public _goldToken;
	ISavingsCELO public _savingsCelo;

	mapping(address => uint256) deposits;
	uint256 public playerCount;
	uint256 public totalDeposited;

	event Deposited(address indexed from, uint256 amount);
	event Withdrew(address indexed from, uint256 amount);

	constructor (
		address savingsCeloAddress
	) public {

		_savingsCelo = ISavingsCELO(savingsCeloAddress);
		_goldToken = IERC20(_registry.getAddressForStringOrDie("GoldToken"));
	}

	function deposit(uint256 amount) external {
		if (deposits[msg.sender] == 0) {
			playerCount += 1;
		}
		deposits[msg.sender] += amount;
		totalDeposited += amount;


		require(
			_goldToken.transferFrom(msg.sender, address(this), amount),
			"CELO transfer failed"
		);

		
		emit Deposited(msg.sender, amount);
	}

	function withdraw (uint256 amount) public {
		require(deposits[msg.sender] >= amount, "Invalid balance");

		deposits[msg.sender] -= amount;
		totalDeposited -= amount;
		if (deposits[msg.sender] - amount == 0) {
			playerCount -= 1;
		} 

		msg.sender.transfer(amount);

		emit Withdrew(msg.sender, amount);
	}

	function getTotalDeposited () external view returns (uint256) {
		return totalDeposited;
	}

	function getDepositsForAddress (address account) external view returns (uint256) {
		return deposits[account];
	}
}