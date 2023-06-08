// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { AllowlistStorage } from './AllowlistStorage.sol';

/**
 * @title AllowlistReadableInternal
 */
abstract contract AllowlistReadableInternal {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Check if address is allowed
     */
    function _isAllowed(address _address) internal view returns (bool) {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        if (l.allowAny) {
            return true;
        }
        return l.allowlist.contains(_address);
    }
}
