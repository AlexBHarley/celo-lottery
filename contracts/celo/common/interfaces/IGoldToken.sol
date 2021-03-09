pragma solidity 0.6.8;

interface IGoldToken {
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);

  function initialize(address registryAddress) external;
  function transfer(address to, uint256 value) external returns (bool);

  function transferWithComment(address to, uint256 value, string calldata comment)
    external
    returns (bool);

  function approve(address spender, uint256 value) external returns (bool);
  function increaseAllowance(address spender, uint256 value) external returns (bool);
  function decreaseAllowance(address spender, uint256 value) external returns (bool);

  function transferFrom(address from, address to, uint256 value)
    external
    returns (bool);

  function mint(address to, uint256 value) external returns (bool);
  
	function name() external view returns (string memory);
  function symbol() external view returns (string memory);
  function decimals() external view returns (uint8);

  function totalSupply() external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);

  function increaseSupply(uint256 amount) external;

  function balanceOf(address owner) external view returns (uint256);
}
