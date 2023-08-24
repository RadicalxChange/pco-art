// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

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

    /**
     * @notice Get allowlist as array
     */
    function _getAllowlist() internal view returns (address[] memory) {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        return l.allowlist.toArray();
    }

    /**
     * @notice Get allow any
     */
    function _getAllowAny() internal view returns (bool) {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        return l.allowAny;
    }
}
