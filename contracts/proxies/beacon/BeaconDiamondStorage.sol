// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol';

library BeaconDiamondStorage {
    struct Layout {
        /// @notice Beacon that stores facet addresses
        IDiamondReadable beacon;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('solidstate.contracts.storage.BeaconDiamond');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        //slither-disable-next-line assembly
        assembly {
            l.slot := slot
        }
    }
}
