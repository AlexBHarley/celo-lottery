pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LotteryToken is ERC20 {
	address _owner;
	mapping(address => bool) allowMinting;

	modifier canMint(address addr) {
    require(allowMinting[addr]);
    _;
	}

	modifier onlyOwner () {
		require(msg.sender == _owner);
		_;
	}

	constructor() ERC20("CeloLotteryToken", "CLOT") public {
		_owner = msg.sender;
	}

	function approveMinting (address addr) onlyOwner public {
		allowMinting[addr] = true;
	}

	function revokeMinting (address addr) onlyOwner public {
		allowMinting[addr] = false;
	}

	function mint (address addr, uint256 amount) canMint(msg.sender) public {
		_mint(addr, amount);
	}

	function burn (address addr, uint256 amount) canMint(msg.sender) public {
		_burn(addr, amount);
	}
}