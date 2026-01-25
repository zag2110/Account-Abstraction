// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SmartAccount} from "./SmartAccount.sol";

/**
 * Factory using deterministic clones (CREATE2) to enable counterfactual addresses.
 */
contract SmartAccountFactory {
    address public immutable implementation;

    event AccountCreated(address indexed account, bytes32 indexed salt);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function _fullSalt(
        bytes32 userSalt,
        address[] calldata owners,
        uint256 threshold,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(userSalt, owners, threshold, guardians, guardianThreshold));
    }

    function predictAccountAddress(
        bytes32 userSalt,
        address[] calldata owners,
        uint256 threshold,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) external view returns (address) {
        bytes32 salt = _fullSalt(userSalt, owners, threshold, guardians, guardianThreshold);
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    function createAccount(
        address entryPoint,
        bytes32 userSalt,
        address[] calldata owners,
        uint256 threshold,
        address[] calldata guardians,
        uint256 guardianThreshold
    ) external returns (address account) {
        bytes32 salt = _fullSalt(userSalt, owners, threshold, guardians, guardianThreshold);

        account = Clones.cloneDeterministic(implementation, salt);

        SmartAccount(payable(account)).initialize(entryPoint, owners, threshold, guardians, guardianThreshold);

        emit AccountCreated(account, salt);
    }
}
