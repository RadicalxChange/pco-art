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
        l.currentAuctionLength = auctionLengthSeconds;
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
        return block.timestamp >= _auctionStartTime();
    }

    /**
     * @notice Is token ready for transfer
     */
    function _isReadyForTransfer() internal view returns (bool) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        return block.timestamp >= _auctionStartTime() + l.currentAuctionLength;
    }

    /**
     * @notice Place a bid
     */
    function _placeBid(address bidder, uint256 collateralAmount) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        EnglishPeriodicAuctionStorage.Bid storage bid = l.bids[bidder];

        uint256 feeAmount;
        if (bidder == l.currentBid.bidder) {
            // If existing bidder, collateral is entire fee amount
            feeAmount = collateralAmount;
        } else {
            // If new bidder, collateral is current bid + fee
            feeAmount = collateralAmount - l.currentBid.bidAmount;
        }

        uint256 bidAmount;
        if (bid.round == l.currentAuctionRound) {
            // If bidder has bid for round, add to existing bid
            bidAmount = _calculateBidFromFee(bid.feeAmount + collateralAmount);
            bid.collateralAmount += collateralAmount;
        } else {
            bidAmount = _calculateBidFromFee(feeAmount);
            bid.collateralAmount = collateralAmount;
        }

        // Check if highest bid
        require(
            bidAmount > l.highestOutstandingBid.bidAmount ||
                l.highestOutstandingBid.bidder == bidder,
            'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid'
        );

        // Save bid
        bid.bidder = bidder;
        bid.bidAmount = bidAmount;
        bid.round = l.currentAuctionRound;

        l.highestOutstandingBid = bid;

        // Check if auction should extend
        uint256 timeRemaining;
        uint256 auctionStartTime = _auctionStartTime();
        if (block.timestamp < auctionStartTime) {
            timeRemaining = 0;
        } else {
            timeRemaining = block.timestamp - auctionStartTime;
        }

        if (timeRemaining < _bidExtensionWindowLengthSeconds()) {
            // Extend auction
            l.currentAuctionLength =
                l.currentAuctionLength +
                _bidExtensionSeconds();
        }
    }

    /**
     * @notice Trigger a transfer to the highest bidder
     */
    function _triggerTransfer() internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        // TODO: Transfer to highest bidder

        // TODO: Transfer bid to previous bidder

        // TODO: Transfer fee to beneficiary

        // Set lastPeriodEndTime to the end of the current auction period
        l.lastPeriodEndTime = block.timestamp;

        // Reset auction
        l.currentAuctionLength = l.auctionLengthSeconds;
        l.currentAuctionRound = l.currentAuctionRound + 1;
    }

    /**
     * @notice Get auction start time
     */
    function _auctionStartTime()
        internal
        view
        returns (uint256 auctionStartTime)
    {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 initialPeriodStartTime = IPeriodicPCOParams(address(this))
            .initialPeriodStartTime();
        uint256 licensePeriod = IPeriodicPCOParams(address(this))
            .licensePeriod();

        if (l.lastPeriodEndTime > initialPeriodStartTime) {
            // Auction starts after licensePeriod has elapsed
            auctionStartTime = l.lastPeriodEndTime + licensePeriod;
        } else {
            // Auction starts at initial time
            auctionStartTime = initialPeriodStartTime;
        }
    }

    /**
     * @notice Calculate bid from fee
     */
    function _calculateBidFromFee(
        uint256 feeAmount
    ) internal view returns (uint256) {
        uint256 perSecondFeeNumerator = IPeriodicPCOParams(address(this))
            .perSecondFeeNumerator();
        uint256 perSecondFeeDenominator = IPeriodicPCOParams(address(this))
            .perSecondFeeDenominator();

        return (feeAmount * perSecondFeeDenominator) / perSecondFeeNumerator;
    }

    /**
     * @notice Calculate fee from bid
     */
    function _calculateFeeFromBid(
        uint256 bidAmount
    ) internal view returns (uint256) {
        uint256 perSecondFeeNumerator = IPeriodicPCOParams(address(this))
            .perSecondFeeNumerator();
        uint256 perSecondFeeDenominator = IPeriodicPCOParams(address(this))
            .perSecondFeeDenominator();

        return (bidAmount * perSecondFeeNumerator) / perSecondFeeDenominator;
    }
}
