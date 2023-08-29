// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title StewardLicenseStorage
 */
library StewardLicenseStorage {
    struct Layout {
        bool isInitialized;
        address initialSteward;
        address minter;
        uint256 maxTokenCount;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.StewardLicenseStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        //slither-disable-next-line assembly
        assembly {
            l.slot := slot
        }
    }
}
