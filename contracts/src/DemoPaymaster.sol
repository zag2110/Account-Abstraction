// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {IPaymaster} from "account-abstraction/interfaces/IPaymaster.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

/**
 * Demo paymaster: accepts every UserOp.
 * This is intentionally unsafe in production, but matches the TD requirement ("approve blindly"). :contentReference[oaicite:2]{index=2}
 */
contract DemoPaymaster is IPaymaster {
    IEntryPoint public immutable entryPoint;
    address public owner;

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "DemoPaymaster: only EntryPoint");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DemoPaymaster: only owner");
        _;
    }

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        owner = msg.sender;
    }

    receive() external payable {}

    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata,
        bytes32,
        uint256
    ) external override onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        // accept all
        return ("", 0);
    }

    function postOp(
        PostOpMode,
        bytes calldata,
        uint256,
        uint256
    ) external override onlyEntryPoint {
        // no-op
    }
}
