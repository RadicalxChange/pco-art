// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { AllowlistStorage } from './AllowlistStorage.sol';

/**
 * @title AllowlistWritableInternal
 */
abstract contract AllowlistWritableInternal {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Initialize allowlist
     */
    function _initializeAllowlist(
        bool _allowAny,
        address[] memory _addresses
    ) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.isInitialized = true;

        _setAllowAny(_allowAny);

        for (uint256 i; i < _addresses.length; i++) {
            l.allowlist.add(_addresses[i]);
        }
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return AllowlistStorage.layout().isInitialized;
    }

    /**
     * @notice Set allow any
     */
    function _setAllowAny(bool _allowAny) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.allowAny = _allowAny;
    }

    /**
     * @notice Add to allowlist
     */
    function _addToAllowlist(address _address) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.allowlist.add(_address);
    }

    /**
     * @notice Remove from allowlist
     */
    function _removeFromAllowlist(address _address) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.allowlist.remove(_address);
    }
}
