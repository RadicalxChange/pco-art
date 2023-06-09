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
