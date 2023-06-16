// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionStorage } from './EnglishPeriodicAuctionStorage.sol';
import { IPeriodicPCOParams } from '../pco/IPeriodicPCOParams.sol';
import { IStewardLicense } from '../license/IStewardLicense.sol';

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
    function _placeBid(
        address bidder,
        uint256 bidAmount,
        uint256 collateralAmount
    ) internal {
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

        if (bid.round == l.currentAuctionRound) {
            // If bidder has bid for round, add to existing bid
            require(
                _checkBidAmount(
                    bidAmount,
                    bid.collateralAmount + collateralAmount
                ),
                'EnglishPeriodicAuction: Incorrect bid amount'
            );
            bid.collateralAmount += collateralAmount;
        } else {
            require(
                _checkBidAmount(bidAmount, feeAmount),
                'EnglishPeriodicAuction: Incorrect bid amount'
            );
            bid.collateralAmount = collateralAmount;
        }

        // Check if highest bid
        require(
            bidAmount >=
                l.highestOutstandingBid.bidAmount + l.minBidIncrement ||
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
     * @notice Withdraw bid collateral if not highest bidder
     */
    function _withdrawBid(address bidder) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        require(
            bidder != l.currentBid.bidder,
            'EnglishPeriodicAuction: Cannot withdraw bid if current bidder'
        );
        require(
            bidder != l.highestOutstandingBid.bidder,
            'EnglishPeriodicAuction: Cannot withdraw bid if highest bidder'
        );

        EnglishPeriodicAuctionStorage.Bid storage bid = l.bids[bidder];

        require(
            bid.collateralAmount > 0,
            'EnglishPeriodicAuction: No collateral to withdraw'
        );

        // Reset collateral and bid
        uint256 collateralAmount = bid.collateralAmount;
        bid.collateralAmount = 0;
        bid.bidAmount = 0;

        // Transfer collateral back to bidder
        (bool success, ) = bidder.call{ value: collateralAmount }('');
        require(
            success,
            'EnglishPeriodicAuction: Failed to withdraw collateral'
        );
    }

    /**
     * @notice Close auction and trigger a transfer to the highest bidder
     */
    function _closeAuction() internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        EnglishPeriodicAuctionStorage.Bid storage winningBid = l
            .highestOutstandingBid;

        // Set lastPeriodEndTime to the end of the current auction period
        l.lastPeriodEndTime = block.timestamp;

        // Reset auction
        address oldBidder = l.currentBid.bidder;
        l.currentBid = winningBid;
        l.currentBid.collateralAmount = 0;
        l.currentAuctionLength = l.auctionLengthSeconds;
        l.currentAuctionRound = l.currentAuctionRound + 1;

        // TODO: Transfer to highest bidder
        // IStewardLicense(address(this)).triggerTransfer(
        //     oldBidder,
        //     winningBid.bidder,
        //     0
        // );

        // TODO: Transfer bid to previous bidder

        // TODO: Transfer fee to beneficiary
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

    /**
     * @notice Check that fee is within rounding error of bid amount
     */
    function _checkBidAmount(
        uint256 bidAmount,
        uint256 feeAmount
    ) internal view returns (bool) {
        uint256 calculatedFeeAmount = _calculateFeeFromBid(bidAmount);

        return calculatedFeeAmount == feeAmount;
    }
}
