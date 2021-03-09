pragma solidity 0.6.8;

contract CalledByVm {
  modifier onlyVm() {
    require(msg.sender == address(0), "Only VM can call");
    _;
  }
}
