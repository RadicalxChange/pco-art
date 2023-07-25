// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { StewardLicenseInternal } from './StewardLicenseInternal.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { IPeriodicAuctionReadable } from '../auction/IPeriodicAuctionReadable.sol';

/**
 * @title StewardLicenseBase
 */
abstract contract StewardLicenseBase is IERC721, StewardLicenseInternal {
    /**
     * @notice Trigger transfer of license
     */
    function triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external {
        require(
            msg.sender == address(this),
            'NativeStewardLicense: Trigger transfer can only be called from another facet'
        );

        _triggerTransfer(from, to, tokenId);
    }

    /**
     * @notice Initial bidder can mint token if it doesn't exist
     */
    function mintToken(address to, uint256 tokenId) external {
        require(
            msg.sender ==
                IPeriodicAuctionReadable(address(this)).initialBidder(),
            'StewardLicenseFacet: only initial bidder can mint token'
        );
        require(
            block.timestamp <
                IPeriodicAuctionReadable(address(this))
                    .initialPeriodStartTime(),
            'StewardLicenseFacet: cannot mint after initial period start time'
        );
        require(
            _exists(tokenId) == false,
            'StewardLicenseFacet: Token already exists'
        );

        _triggerTransfer(address(0), to, tokenId);
    }

    /**
     * @notice Get max token count
     */
    function maxTokenCount() external view returns (uint256) {
        return _maxTokenCount();
    }

    /**
     * @notice Check if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }
}
