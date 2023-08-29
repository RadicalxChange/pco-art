// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';

/**
 * @title AllowlistStorage
 */
library AllowlistStorage {
    struct Layout {
        bool isInitialized;
        bool allowAny;
        EnumerableSet.AddressSet allowlist;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.AllowlistStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        //slither-disable-next-line assembly
        assembly {
            l.slot := slot
        }
    }
}
