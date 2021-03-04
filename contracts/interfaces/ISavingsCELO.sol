pragma solidity 0.6.8;

import "./IGovernance.sol";


interface ISavingsCELO {
	function authorizeVoteSigner(
		address signer,
		uint8 v,
		bytes32 r,
		bytes32 s
	) external;

	function authorizeVoterProxy(address proxy) external;

	function proxyVote(
		address group,
		uint256 value,
		address lesser,
		address greater) external returns (bool);
	function proxyActivate(address group) external returns (bool);
	function proxyRevokeActive(
		address group,
		uint256 value,
		address lesser,
		address greater,
		uint256 index
	) external returns (bool);
	function proxyRevokePending(
		address group,
		uint256 value,
		address lesser,
		address greater,
		uint256 index
	) external returns (bool);

	function proxyGovernanceVote(
		uint256 proposalId,
		uint256 index,
		Governance.VoteValue value
	) external returns (bool);
	function proxyGovernanceUpvote(
		uint256 proposalId,
		uint256 lesser,
		uint256 greater
	) external returns (bool);
	function proxyGovernanceRevokeUpvote(
		uint256 lesser,
		uint256 greater
	) external returns (bool);

	function deposit(uint256 celoAmount) external;
	function withdrawStart(
		uint256 savingsAmount,
		address lesserAfterPendingRevoke,
		address greaterAfterPendingRevoke,
		address lesserAfterActiveRevoke,
		address greaterAfterActiveRevoke
	) external;

	function withdrawFinish(uint256 index, uint256 indexGlobal) external;
	function withdrawCancel(uint256 index, uint256 indexGlobal) external;
	function pendingWithdrawals(address addr)
		external
		view
		returns (uint256[] memory, uint256[] memory);

	function savingsToCELO(uint256 savingsAmount) external view returns (uint256);
	function celoToSavings(uint256 celoAmount) external view returns (uint256);
}