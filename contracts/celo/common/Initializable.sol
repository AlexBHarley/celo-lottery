pragma solidity 0.6.8;

contract Initializable {
  bool public initialized;

  modifier initializer() {
    require(!initialized, "contract already initialized");
    initialized = true;
    _;
  }
}
