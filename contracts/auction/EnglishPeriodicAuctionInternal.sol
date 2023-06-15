// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionStorage } from './EnglishPeriodicAuctionStorage.sol';
import { IPeriodicPCOParams } from '../pco/IPeriodicPCOParams.sol';

/**
 * @title EnglishPeriodicAuctionInternal
 */
abstract contract EnglishPeriodicAuctionInternal {
    /**
     * @notice Initialize parameters
     */
    function _initializeAuction(
        uint256 auctionLengthSeconds,
        uint256 minBidIncrement,
        uint256 bidExtensionWindowLengthSeconds,
        uint256 bidExtensionSeconds
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        l.isInitialized = true;
        l.auctionLengthSeconds = auctionLengthSeconds;
        l.minBidIncrement = minBidIncrement;
        l.bidExtensionWindowLengthSeconds = bidExtensionWindowLengthSeconds;
        l.bidExtensionSeconds = bidExtensionSeconds;
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return EnglishPeriodicAuctionStorage.layout().isInitialized;
    }

    /**
     * @notice Get auction length
     */
    function _auctionLengthSeconds() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().auctionLengthSeconds;
    }

    /**
     * @notice Get minimum bid increment
     */
    function _minBidIncrement() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().minBidIncrement;
    }

    /**
     * @notice Get bid extension window length
     */
    function _bidExtensionWindowLengthSeconds()
        internal
        view
        returns (uint256)
    {
        return
            EnglishPeriodicAuctionStorage
                .layout()
                .bidExtensionWindowLengthSeconds;
    }

    /**
     * @notice Get bid extension
     */
    function _bidExtensionSeconds() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().bidExtensionSeconds;
    }

    /**
     * @notice Get is auction period
     */
    function _isAuctionPeriod() internal view returns (bool) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 initialPeriodStartTime = IPeriodicPCOParams(address(this))
            .initialPeriodStartTime();
        uint256 licensePeriod = IPeriodicPCOParams(address(this))
            .licensePeriod();

        uint256 auctionStartTime;
        if (l.lastPeriodEndTime > initialPeriodStartTime) {
            // Auction starts after licensePeriod has elapsed
            auctionStartTime = l.lastPeriodEndTime + licensePeriod;
        } else {
            // Auction starts at initial time
            auctionStartTime = initialPeriodStartTime;
        }

        return block.timestamp >= auctionStartTime;
    }

    /**
     * @notice Trigger a transfer to the highest bidder
     */
    function _triggerTransfer() internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        // TODO: Transfer to highest bidder

        // Set lastPeriodEndTime to the end of the current auction period
        l.lastPeriodEndTime = block.timestamp;
    }
}
