// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title PeriodicPCOParamsStorage
 */
library PeriodicPCOParamsStorage {
    struct Layout {
        bool isInitialized;
        /// @dev Length of time in seconds for each period the license is valid for
        uint256 licensePeriod;
        /// @dev Fee numerator
        uint256 feeNumerator;
        /// @dev Fee denominator
        uint256 feeDenominator;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.PeriodicPCOParamsStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
