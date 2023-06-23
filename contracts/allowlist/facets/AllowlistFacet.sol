// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { IAllowlistWritable } from '../IAllowlistWritable.sol';
import { AllowlistStorage } from '../AllowlistStorage.sol';
import { AllowlistReadableInternal } from '../AllowlistReadableInternal.sol';
import { AllowlistWritableInternal } from '../AllowlistWritableInternal.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
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
    ERC165Base
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
        require(
            _isInitialized() == false,
            'AllowlistFacet: already initialized'
        );

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
        require(
            _isInitialized() == false,
            'AllowlistFacet: already initialized'
        );

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
     * @notice Add to allowlist
     */
    function addToAllowlist(
        address _address
    ) external onlyRole(COMPONENT_ROLE) {
        return _addToAllowlist(_address);
    }

    /**
     * @notice Remove from allowlist
     */
    function removeFromAllowlist(
        address _address
    ) external onlyRole(COMPONENT_ROLE) {
        return _removeFromAllowlist(_address);
    }
}