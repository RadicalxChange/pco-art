// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { StewardLicenseInternal } from '../StewardLicenseInternal.sol';
import { IStewardLicense } from '../IStewardLicense.sol';
import { StewardLicenseBase } from '../StewardLicenseBase.sol';

/**
 * @title NativeStewardLicenseFacet
 * @dev ERC-1155 token license for Steward. Transfers are disabled during an auction
 */
contract NativeStewardLicenseFacet is
    StewardLicenseInternal,
    StewardLicenseBase
{
    /**
     * @notice Initialize license
     */
    function initializeStewardLicense(
        address minter_,
        address addToCollectionMinter_,
        address steward_,
        uint256 maxTokenCount_,
        bool shouldMint,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external {
        require(!_isInitialized(), 'StewardLicenseFacet: already initialized');

        _initializeStewardLicense(
            minter_,
            addToCollectionMinter_,
            steward_,
            maxTokenCount_,
            shouldMint,
            name,
            symbol,
            baseURI
        );
    }

    /**
     * @notice Get minter
     */
    function minter() external view returns (address) {
        return _minter();
    }
}
