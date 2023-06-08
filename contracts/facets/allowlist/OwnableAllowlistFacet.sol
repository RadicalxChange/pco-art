// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';
import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';

/**
 * @title OwnableAllowlistFacet
 * @dev Allows owner to set an allowlist of addresses
 */
contract OwnableAllowlistFacet is SafeOwnable {
    using EnumerableSet for EnumerableSet.AddressSet;

    bool allowAny;
    EnumerableSet.AddressSet allowlist;

    constructor(address owner, bool _allowAny) {
        _setOwner(owner);
        allowAny = _allowAny;
    }

    /**
     * @notice Check if address is allowed
     */
    function isAllowed(address _address) external view returns (bool) {
        if (allowAny) {
            return true;
        }
        return allowlist.contains(_address);
    }

    /**
     * @notice Set allow any
     */
    function setAllowAny(bool _allowAny) external onlyOwner {
        allowAny = _allowAny;
    }

    /**
     * @notice Add to allowlist
     */
    function addToAllowlist(address _address) external onlyOwner {
        allowlist.add(_address);
    }

    /**
     * @notice Remove from allowlist
     */
    function removeFromAllowlist(address _address) external onlyOwner {
        allowlist.remove(_address);
    }
}
