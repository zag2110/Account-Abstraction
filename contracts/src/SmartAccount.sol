// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

/**
 * Minimal ERC-4337 v0.7-compatible Smart Account
 * - multisig (threshold)
 * - batching
 * - session keys (expiry + optional one-time)
 * - social recovery (guardians threshold)
 *
 * Notes:
 * - Nonce is stored in-account (simple sequential nonce).
 * - validateUserOp returns SIG_VALIDATION_FAILED (1) instead of revert on bad sig.
 */
contract SmartAccount {
    using ECDSA for bytes32;

    // EntryPoint v0.7 on Sepolia:
    // 0x0000000071727De22E5E9d8BAf0edAc6f37da032
    address public entryPoint;

    bool private _initialized;

    // ---- owners / multisig ----
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public threshold;

    // ---- simple sequential nonce ----
    uint256 public nonce;

    // ---- session keys ----
    struct SessionKey {
        uint48 validUntil; // unix timestamp
        bool oneTime;
        bool used;
    }
    mapping(address => SessionKey) public sessionKeys;

    // ---- social recovery (guardians) ----
    mapping(address => bool) public isGuardian;
    address[] public guardians;
    uint256 public guardianThreshold;

    bytes32 public pendingRecoveryHash;
    uint256 public recoveryApprovals;
    mapping(address => bool) public recoveryApprovedBy;

    // ---- events ----
    event Initialized(address indexed entryPoint, address[] owners, uint256 threshold);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);

    event SessionKeyAdded(address indexed key, uint48 validUntil, bool oneTime);
    event SessionKeyRevoked(address indexed key);
    event SessionKeyUsed(address indexed key);

    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event GuardianThresholdChanged(uint256 threshold);

    event RecoveryProposed(bytes32 indexed recoveryHash);
    event RecoveryApproved(address indexed guardian, bytes32 indexed recoveryHash, uint256 approvals);
    event RecoveryExecuted(bytes32 indexed recoveryHash);

    error NotEntryPoint();
    error NotOwnerOrEntryPoint();
    error NotOwner();
    error NotGuardian();
    error AlreadyInitialized();
    error BadOwners();
    error BadThreshold();
    error BadGuardians();
    error BadGuardianThreshold();
    error InvalidSignatureMode();
    error InvalidBatchLengths();
    error RecoveryHashMismatch();
    error RecoveryNotEnoughApprovals();

    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint) revert NotEntryPoint();
        _;
    }

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier onlyOwnerOrEntryPoint() {
        if (msg.sender != entryPoint && !isOwner[msg.sender]) revert NotOwnerOrEntryPoint();
        _;
    }

    modifier onlyGuardian() {
        if (!isGuardian[msg.sender]) revert NotGuardian();
        _;
    }

    // -------------------------
    // Initialization (for clones)
    // -------------------------
    function initialize(
        address _entryPoint,
        address[] calldata _owners,
        uint256 _threshold,
        address[] calldata _guardians,
        uint256 _guardianThreshold
    ) external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;

        if (_entryPoint == address(0)) revert NotEntryPoint();
        entryPoint = _entryPoint;

        _setOwners(_owners, _threshold);
        _setGuardians(_guardians, _guardianThreshold);

        emit Initialized(_entryPoint, _owners, _threshold);
    }

    // -------------------------
    // ERC-4337 validateUserOp
    // -------------------------
    /**
     * validateUserOp(PackedUserOperation,userOpHash,missingAccountFunds) => validationData
     *
     * Return value encoding (same convention as reference implementation):
     * - sig failure => 1
     * - validUntil in bits [160..208)
     * - validAfter in bits [208..256)
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external onlyEntryPoint returns (uint256 validationData) {
        // nonce check (simple sequential)
        if (userOp.nonce != nonce) {
            return _packValidationData(true, 0, 0);
        }
        nonce++;

        // signature check
        validationData = _validateSignature(userOpHash, userOp.signature);

        // pay prefund if asked
        if (missingAccountFunds != 0) {
            // no revert on failure (best-effort)
            (bool ok,) = payable(msg.sender).call{value: missingAccountFunds}("");
            ok;
        }
    }

    // signature format:
    // signature = abi.encode(uint8 mode, bytes payload)
    //
    // mode 0 (multisig owners):
    // payload = abi.encode(address[] signersSortedAsc, bytes[] sigs)  // ECDSA over userOpHash (eth_sign)
    //
    // mode 1 (session key):
    // payload = abi.encode(address sessionKey, bytes sig)             // ECDSA over userOpHash (eth_sign)
    function _validateSignature(bytes32 userOpHash, bytes calldata signature)
        internal
        returns (uint256 validationData)
    {
        if (signature.length < 1) {
            return _packValidationData(true, 0, 0);
        }

        (uint8 mode, bytes memory payload) = abi.decode(signature, (uint8, bytes));

        if (mode == 0) {
            return _validateOwners(userOpHash, payload);
        } else if (mode == 1) {
            return _validateSessionKey(userOpHash, payload);
        } else {
            revert InvalidSignatureMode();
        }
    }

    /// @dev Manual eth_sign digest (avoids OZ version differences)
    function _ethSigned(bytes32 h) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h));
    }

    function _validateOwners(bytes32 userOpHash, bytes memory payload) internal view returns (uint256) {
        (address[] memory signers, bytes[] memory sigs) = abi.decode(payload, (address[], bytes[]));
        if (signers.length != sigs.length || signers.length < threshold) {
            return _packValidationData(true, 0, 0);
        }

        // enforce strictly increasing order to prevent duplicates cheaply
        address prev = address(0);

        bytes32 digest = _ethSigned(userOpHash);

        uint256 validCount = 0;
        for (uint256 i = 0; i < signers.length; i++) {
            address signer = signers[i];
            if (signer <= prev) {
                return _packValidationData(true, 0, 0);
            }
            prev = signer;

            if (!isOwner[signer]) {
                return _packValidationData(true, 0, 0);
            }

            address recovered = digest.recover(sigs[i]);
            if (recovered != signer) {
                return _packValidationData(true, 0, 0);
            }

            validCount++;
            if (validCount == threshold) {
                // success
                return _packValidationData(false, 0, 0);
            }
        }

        return _packValidationData(true, 0, 0);
    }

    function _validateSessionKey(bytes32 userOpHash, bytes memory payload) internal returns (uint256) {
        (address key, bytes memory sig) = abi.decode(payload, (address, bytes));
        SessionKey storage sk = sessionKeys[key];

        if (sk.validUntil == 0) return _packValidationData(true, 0, 0);
        if (block.timestamp > sk.validUntil) return _packValidationData(true, 0, 0);
        if (sk.oneTime && sk.used) return _packValidationData(true, 0, 0);

        bytes32 digest = _ethSigned(userOpHash);

        address recovered = digest.recover(sig);
        if (recovered != key) return _packValidationData(true, 0, 0);

        if (sk.oneTime) {
            sk.used = true;
            emit SessionKeyUsed(key);
        }

        return _packValidationData(false, sk.validUntil, 0);
    }

    function _packValidationData(bool sigFailed, uint48 validUntil, uint48 validAfter)
        internal
        pure
        returns (uint256)
    {
        // SIG_VALIDATION_FAILED == 1
        uint256 data = sigFailed ? 1 : 0;
        data |= uint256(validUntil) << 160;
        data |= uint256(validAfter) << 208;
        return data;
    }

    // -------------------------
    // Execution
    // -------------------------
    function execute(address target, uint256 value, bytes calldata data) external onlyOwnerOrEntryPoint {
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)
        external
        onlyOwnerOrEntryPoint
    {
        if (targets.length != values.length || targets.length != datas.length) revert InvalidBatchLengths();

        for (uint256 i = 0; i < targets.length; i++) {
            (bool ok, bytes memory ret) = targets[i].call{value: values[i]}(datas[i]);
            if (!ok) {
                assembly {
                    revert(add(ret, 32), mload(ret))
                }
            }
        }
    }

    receive() external payable {}

    // -------------------------
    // Owner management (simple)
    // -------------------------
    function addOwner(address owner) external onlyOwner {
        if (owner == address(0) || isOwner[owner]) revert BadOwners();
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAdded(owner);
    }

    function removeOwner(address owner) external onlyOwner {
        if (!isOwner[owner]) revert BadOwners();
        isOwner[owner] = false;
        emit OwnerRemoved(owner);

        if (threshold > _activeOwnerCount()) {
            threshold = _activeOwnerCount();
            emit ThresholdChanged(threshold);
        }
    }

    function setThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0) revert BadThreshold();
        if (newThreshold > _activeOwnerCount()) revert BadThreshold();
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    function _activeOwnerCount() internal view returns (uint256 c) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (isOwner[owners[i]]) c++;
        }
    }

    function _setOwners(address[] calldata _owners, uint256 _threshold) internal {
        if (_owners.length == 0) revert BadOwners();

        // require sorted unique
        address prev = address(0);
        for (uint256 i = 0; i < _owners.length; i++) {
            address o = _owners[i];
            if (o == address(0) || o <= prev) revert BadOwners();
            prev = o;
            isOwner[o] = true;
            owners.push(o);
        }

        if (_threshold == 0 || _threshold > _owners.length) revert BadThreshold();
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    // -------------------------
    // Session keys
    // -------------------------
    function addSessionKey(address key, uint48 validUntil, bool oneTime) external onlyOwner {
        if (key == address(0) || validUntil <= block.timestamp) revert BadOwners();
        sessionKeys[key] = SessionKey({validUntil: validUntil, oneTime: oneTime, used: false});
        emit SessionKeyAdded(key, validUntil, oneTime);
    }

    function revokeSessionKey(address key) external onlyOwner {
        delete sessionKeys[key];
        emit SessionKeyRevoked(key);
    }

    // -------------------------
    // Guardians / Recovery
    // -------------------------
    function proposeRecovery(address[] calldata newOwners, uint256 newThreshold) external onlyOwner {
        bytes32 rh = keccak256(abi.encode(newOwners, newThreshold));
        pendingRecoveryHash = rh;

        // reset approvals
        recoveryApprovals = 0;
        for (uint256 i = 0; i < guardians.length; i++) {
            recoveryApprovedBy[guardians[i]] = false;
        }

        emit RecoveryProposed(rh);
    }

    function approveRecovery(bytes32 recoveryHash) external onlyGuardian {
        if (recoveryHash != pendingRecoveryHash) revert RecoveryHashMismatch();
        if (recoveryApprovedBy[msg.sender]) return;

        recoveryApprovedBy[msg.sender] = true;
        recoveryApprovals += 1;

        emit RecoveryApproved(msg.sender, recoveryHash, recoveryApprovals);
    }

    function executeRecovery(address[] calldata newOwners, uint256 newThreshold) external {
        bytes32 rh = keccak256(abi.encode(newOwners, newThreshold));
        if (rh != pendingRecoveryHash) revert RecoveryHashMismatch();
        if (recoveryApprovals < guardianThreshold) revert RecoveryNotEnoughApprovals();

        // wipe old owners mapping
        for (uint256 i = 0; i < owners.length; i++) {
            isOwner[owners[i]] = false;
        }
        delete owners;

        // set new
        _setOwners(newOwners, newThreshold);

        // clear proposal
        pendingRecoveryHash = bytes32(0);
        recoveryApprovals = 0;

        emit RecoveryExecuted(rh);
    }

    function addGuardian(address g) external onlyOwner {
        if (g == address(0) || isGuardian[g]) revert BadGuardians();
        isGuardian[g] = true;
        guardians.push(g);
        emit GuardianAdded(g);
    }

    function removeGuardian(address g) external onlyOwner {
        if (!isGuardian[g]) revert BadGuardians();
        isGuardian[g] = false;
        emit GuardianRemoved(g);

        if (guardianThreshold > _activeGuardianCount()) {
            guardianThreshold = _activeGuardianCount();
            emit GuardianThresholdChanged(guardianThreshold);
        }
    }

    function setGuardianThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0) revert BadGuardianThreshold();
        if (newThreshold > _activeGuardianCount()) revert BadGuardianThreshold();
        guardianThreshold = newThreshold;
        emit GuardianThresholdChanged(newThreshold);
    }

    function _activeGuardianCount() internal view returns (uint256 c) {
        for (uint256 i = 0; i < guardians.length; i++) {
            if (isGuardian[guardians[i]]) c++;
        }
    }

    function _setGuardians(address[] calldata _guardians, uint256 _gThreshold) internal {
        if (_guardians.length == 0) {
            guardianThreshold = 0;
            return;
        }

        address prev = address(0);
        for (uint256 i = 0; i < _guardians.length; i++) {
            address g = _guardians[i];
            if (g == address(0) || g <= prev) revert BadGuardians();
            prev = g;
            isGuardian[g] = true;
            guardians.push(g);
        }

        if (_gThreshold == 0 || _gThreshold > _guardians.length) revert BadGuardianThreshold();
        guardianThreshold = _gThreshold;
        emit GuardianThresholdChanged(_gThreshold);
    }
}
