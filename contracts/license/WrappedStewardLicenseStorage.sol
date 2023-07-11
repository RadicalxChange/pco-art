// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title WrappedStewardLicenseStorage
 */
library WrappedStewardLicenseStorage {
    struct Layout {
        address wrappedTokenAddress;
        uint256 wrappedTokenId;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.WrappedStewardLicenseStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
