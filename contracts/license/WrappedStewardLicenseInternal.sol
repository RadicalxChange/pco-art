// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { WrappedStewardLicenseStorage } from './WrappedStewardLicenseStorage.sol';

/**
 * @title WrappedStewardLicenseInternal
 */
abstract contract WrappedStewardLicenseInternal {
    /**
     * @notice Initialize license
     */
    function _initializeWrappedLicense(
        address wrappedTokenAddress,
        uint256 wrappedTokenId
    ) internal {
        WrappedStewardLicenseStorage.Layout
            storage l = WrappedStewardLicenseStorage.layout();

        l.wrappedTokenAddress = wrappedTokenAddress;
        l.wrappedTokenId = wrappedTokenId;
    }

    /**
     * @notice Get wrapped token address
     */
    function _wrappedTokenAddress() internal view returns (address) {
        return WrappedStewardLicenseStorage.layout().wrappedTokenAddress;
    }

    /**
     * @notice Get wrapped token ID
     */
    function _wrappedTokenId() internal view returns (uint256) {
        return WrappedStewardLicenseStorage.layout().wrappedTokenId;
    }
}
