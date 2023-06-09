// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';
import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { IOwnableAllowlist } from '../IOwnableAllowlist.sol';
import { AllowlistStorage } from '../AllowlistStorage.sol';
import { AllowlistReadableInternal } from '../AllowlistReadableInternal.sol';
import { AllowlistWritableInternal } from '../AllowlistWritableInternal.sol';

/**
 * @title OwnableAllowlistFacet
 * @dev Allows owner to set an allowlist of addresses
 */
contract OwnableAllowlistFacet is
    SafeOwnable,
    IOwnableAllowlist,
    AllowlistReadableInternal,
    AllowlistWritableInternal
{
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Initialize allowlist
     */
    function initializeAllowlist(
        address _owner,
        bool allowAny,
        address[] memory _addresses
    ) external {
        require(
            _isInitialized() == false,
            'OwnableAllowlistFacet: already initialized'
        );

        _setOwner(_owner);
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
    function setAllowAny(bool _allowAny) external onlyOwner {
        return _setAllowAny(_allowAny);
    }

    /**
     * @notice Add to allowlist
     */
    function addToAllowlist(address _address) external onlyOwner {
        return _addToAllowlist(_address);
    }

    /**
     * @notice Remove from allowlist
     */
    function removeFromAllowlist(address _address) external onlyOwner {
        return _removeFromAllowlist(_address);
    }
}
