// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { IAllowlistWritable } from '../IAllowlistWritable.sol';
import { AllowlistStorage } from '../AllowlistStorage.sol';
import { AllowlistReadableInternal } from '../AllowlistReadableInternal.sol';
import { AllowlistWritableInternal } from '../AllowlistWritableInternal.sol';
import { ERC165BaseInternal } from '@solidstate/contracts/introspection/ERC165/base/ERC165BaseInternal.sol';
import { AccessControlInternal } from '@solidstate/contracts/access/access_control/AccessControlInternal.sol';
import { IAllowlistReadable } from '../IAllowlistReadable.sol';

/**
 * @title AllowlistFacet
 * @dev Allows owner to set an allowlist of addresses
 */
contract AllowlistFacet is
    AccessControlInternal,
    IAllowlistWritable,
    IAllowlistReadable,
    AllowlistReadableInternal,
    AllowlistWritableInternal,
    ERC165BaseInternal
{
    using EnumerableSet for EnumerableSet.AddressSet;

    // Component role
    bytes32 internal constant COMPONENT_ROLE =
        keccak256('AllowlistFacet.COMPONENT_ROLE');

    /**
     * @notice Initialize allowlist
     */
    function initializeAllowlist(
        bool allowAny,
        address[] memory _addresses
    ) external {
        require(!_isInitialized(), 'AllowlistFacet: already initialized');

        _setSupportsInterface(type(IAllowlistReadable).interfaceId, true);
        _initializeAllowlist(allowAny, _addresses);
    }

    /**
     * @notice Initialize allowlist with owner
     */
    function initializeAllowlist(
        address _owner,
        bool allowAny,
        address[] memory _addresses
    ) external {
        require(!_isInitialized(), 'AllowlistFacet: already initialized');

        _setSupportsInterface(type(IAllowlistReadable).interfaceId, true);
        _setSupportsInterface(type(IAllowlistWritable).interfaceId, true);
        _grantRole(COMPONENT_ROLE, _owner);
        _initializeAllowlist(allowAny, _addresses);
    }

    /**
     * @notice Check if address is allowed
     */
    function isAllowed(address _address) external view returns (bool) {
        return _isAllowed(_address);
    }

    /**
     * @notice Set allow any
     */
    function setAllowAny(bool _allowAny) external onlyRole(COMPONENT_ROLE) {
        return _setAllowAny(_allowAny);
    }

    /**
     * @notice Get allow any
     */
    function getAllowAny() external view returns (bool) {
        return _getAllowAny();
    }

    /**
     * @notice Get allowlist as array
     */
    function getAllowlist() external view returns (address[] memory) {
        return _getAllowlist();
    }

    /**
     * @notice Add to allowlist
     */
    function addToAllowlist(
        address _address
    ) external onlyRole(COMPONENT_ROLE) {
        _addToAllowlist(_address);
    }

    /**
     * @notice Add to allowlist with allow any
     */
    function addToAllowlist(
        address _address,
        bool _allowAny
    ) external onlyRole(COMPONENT_ROLE) {
        _addToAllowlist(_address);
        _setAllowAny(_allowAny);
    }

    /**
     * @notice Remove from allowlist
     */
    function removeFromAllowlist(
        address _address
    ) external onlyRole(COMPONENT_ROLE) {
        _removeFromAllowlist(_address);
    }

    /**
     * @notice Remove from allowlist with allow any
     */
    function removeFromAllowlist(
        address _address,
        bool _allowAny
    ) external onlyRole(COMPONENT_ROLE) {
        _removeFromAllowlist(_address);
        _setAllowAny(_allowAny);
    }

    /**
     * @notice Batch add to allowlist
     */
    function batchAddToAllowlist(
        address[] memory _addresses
    ) external onlyRole(COMPONENT_ROLE) {
        _batchAddToAllowlist(_addresses);
    }

    /**
     * @notice Batch add to allowlist with allow any
     */
    function batchAddToAllowlist(
        address[] memory _addresses,
        bool _allowAny
    ) external onlyRole(COMPONENT_ROLE) {
        _batchAddToAllowlist(_addresses);
        _setAllowAny(_allowAny);
    }

    /**
     * @notice Batch remove from allowlist
     */
    function batchRemoveFromAllowlist(
        address[] memory _addresses
    ) external onlyRole(COMPONENT_ROLE) {
        _batchRemoveFromAllowlist(_addresses);
    }

    /**
     * @notice Batch remove from allowlist with allow any
     */
    function batchRemoveFromAllowlist(
        address[] memory _addresses,
        bool _allowAny
    ) external onlyRole(COMPONENT_ROLE) {
        _batchRemoveFromAllowlist(_addresses);
        _setAllowAny(_allowAny);
    }

    /**
     * @notice Batch update allowlist
     */
    function batchUpdateAllowlist(
        address[] memory _removeAddresses,
        address[] memory _addAddresses
    ) external onlyRole(COMPONENT_ROLE) {
        _batchRemoveFromAllowlist(_removeAddresses);
        _batchAddToAllowlist(_addAddresses);
    }

    /**
     * @notice Batch update allowlist with allow any
     */
    function batchUpdateAllowlist(
        address[] memory _removeAddresses,
        address[] memory _addAddresses,
        bool _allowAny
    ) external onlyRole(COMPONENT_ROLE) {
        _batchRemoveFromAllowlist(_removeAddresses);
        _batchAddToAllowlist(_addAddresses);
        _setAllowAny(_allowAny);
    }
}
