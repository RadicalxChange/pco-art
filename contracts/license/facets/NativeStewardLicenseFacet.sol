// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
        address _minter,
        address _addToCollectionMinter,
        address _steward,
        uint256 _maxTokenCount,
        bool shouldMint,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external {
        require(
            _isInitialized() == false,
            'StewardLicenseFacet: already initialized'
        );

        _initializeStewardLicense(
            _minter,
            _addToCollectionMinter,
            _steward,
            _maxTokenCount,
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
