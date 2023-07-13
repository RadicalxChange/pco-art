// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionStorage } from './EnglishPeriodicAuctionStorage.sol';
import { IPeriodicPCOParamsReadable } from '../pco/IPeriodicPCOParamsReadable.sol';
import { IStewardLicense } from '../license/IStewardLicense.sol';
import { IBeneficiary } from '../beneficiary/IBeneficiary.sol';
import { IEnglishPeriodicAuctionInternal } from './IEnglishPeriodicAuctionInternal.sol';

/**
 * @title EnglishPeriodicAuctionInternal
 */
abstract contract EnglishPeriodicAuctionInternal is
    IEnglishPeriodicAuctionInternal
{
    /**
     * @notice Initialize parameters
     */
    function _initializeAuction(
        address repossessor,
        address initialBidder,
        uint256 initialPeriodStartTime,
        uint256 startingBid,
        uint256 auctionLengthSeconds,
        uint256 minBidIncrement,
        uint256 bidExtensionWindowLengthSeconds,
        uint256 bidExtensionSeconds
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        l.isInitialized = true;
        _setRepossessor(repossessor);
        _setInitialPeriodStartTime(initialPeriodStartTime);
        _setAuctionLengthSeconds(auctionLengthSeconds);
        _setMinBidIncrement(minBidIncrement);
        _setBidExtensionWindowLengthSeconds(bidExtensionWindowLengthSeconds);
        _setBidExtensionSeconds(bidExtensionSeconds);
        l.currentAuctionLength = auctionLengthSeconds;
        l.currentAuctionRound = 1;

        l.currentBid.round = 1;
        l.currentBid.bidder = initialBidder;
        l.currentBid.bidAmount = startingBid;
        l.currentBid.collateralAmount = 0;
        l.currentBid.feeAmount = 0;
        l.bids[initialBidder] = l.currentBid;

        l.highestBid.bidder = repossessor;
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return EnglishPeriodicAuctionStorage.layout().isInitialized;
    }

    /**
     * @notice Get repossessor
     */
    function _repossessor() internal view returns (address) {
        return EnglishPeriodicAuctionStorage.layout().repossessor;
    }

    /**
     * @notice Set repossessor
     */
    function _setRepossessor(address repossessor) internal {
        EnglishPeriodicAuctionStorage.layout().repossessor = repossessor;
    }

    /**
     * @notice Get initial period start time
     */
    function _initialPeriodStartTime() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().initialPeriodStartTime;
    }

    /**
     * @notice Set initial period start time
     */
    function _setInitialPeriodStartTime(
        uint256 initialPeriodStartTime
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        l.initialPeriodStartTime = initialPeriodStartTime;

        emit InitialPeriodStartTimeSet(initialPeriodStartTime);
    }

    /**
     * @notice Get auction length
     */
    function _auctionLengthSeconds() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().auctionLengthSeconds;
    }

    /**
     * @notice Set auction length
     */
    function _setAuctionLengthSeconds(uint256 auctionLengthSeconds) internal {
        EnglishPeriodicAuctionStorage
            .layout()
            .auctionLengthSeconds = auctionLengthSeconds;
    }

    /**
     * @notice Get minimum bid increment
     */
    function _minBidIncrement() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().minBidIncrement;
    }

    /**
     * @notice Set minimum bid increment
     */
    function _setMinBidIncrement(uint256 minBidIncrement) internal {
        EnglishPeriodicAuctionStorage
            .layout()
            .minBidIncrement = minBidIncrement;
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
     * @notice Set bid extension window length
     */
    function _setBidExtensionWindowLengthSeconds(
        uint256 bidExtensionWindowLengthSeconds
    ) internal {
        EnglishPeriodicAuctionStorage
            .layout()
            .bidExtensionWindowLengthSeconds = bidExtensionWindowLengthSeconds;
    }

    /**
     * @notice Get bid extension
     */
    function _bidExtensionSeconds() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().bidExtensionSeconds;
    }

    /**
     * @notice Set bid extension
     */
    function _setBidExtensionSeconds(uint256 bidExtensionSeconds) internal {
        EnglishPeriodicAuctionStorage
            .layout()
            .bidExtensionSeconds = bidExtensionSeconds;
    }

    /**
     * @notice Get highest outstanding bid
     */
    function _highestBid() internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().highestBid;
    }

    /**
     * @notice Get current bid
     */
    function _currentBid() internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().currentBid;
    }

    /**
     * @notice Get bid for address
     */
    function _bidOf(address bidder) internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().bids[bidder];
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
        return block.timestamp >= _auctionEndTime();
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

        Bid storage bid = l.bids[bidder];

        // Check if highest bid
        require(
            bidAmount >= l.highestBid.bidAmount + l.minBidIncrement,
            'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid'
        );

        uint256 totalCollateralAmount;
        if (bid.round == l.currentAuctionRound) {
            // If bidder has bid for round, add to existing bid
            totalCollateralAmount = bid.collateralAmount + collateralAmount;
        } else {
            totalCollateralAmount = collateralAmount;
        }

        uint256 feeAmount;
        address currentBidder = IStewardLicense(address(this)).ownerOf(0);
        if (bidder == currentBidder) {
            // If current bidder, collateral is entire fee amount
            feeAmount = totalCollateralAmount;
        } else {
            require(
                totalCollateralAmount > bidAmount,
                'EnglishPeriodicAuction: Collateral must be greater than current bid'
            );
            // If new bidder, collateral is bidAmount + fee
            feeAmount = totalCollateralAmount - bidAmount;
        }

        require(
            _checkBidAmount(bidAmount, feeAmount),
            'EnglishPeriodicAuction: Incorrect bid amount'
        );

        // Save bid
        bid.bidder = bidder;
        bid.bidAmount = bidAmount;
        bid.round = l.currentAuctionRound;
        bid.feeAmount = feeAmount;
        bid.collateralAmount = totalCollateralAmount;

        l.highestBid = bid;

        // Check if auction should extend
        uint256 auctionEndTime = _auctionEndTime();

        if (
            auctionEndTime >= block.timestamp &&
            auctionEndTime - block.timestamp <
            _bidExtensionWindowLengthSeconds()
        ) {
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

        address currentBidder = IStewardLicense(address(this)).ownerOf(0);

        require(
            bidder != currentBidder,
            'EnglishPeriodicAuction: Cannot withdraw bid if current bidder'
        );
        require(
            bidder != l.highestBid.bidder,
            'EnglishPeriodicAuction: Cannot withdraw bid if highest bidder'
        );

        Bid storage bid = l.bids[bidder];

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

        address oldBidder = IStewardLicense(address(this)).ownerOf(0);

        // Set lastPeriodEndTime to the end of the current auction period
        l.lastPeriodEndTime = block.timestamp;

        if (l.highestBid.round != l.currentAuctionRound) {
            // No bids were placed, transfer to reposssessor
            Bid storage repossessorBid = l.bids[l.repossessor];
            repossessorBid.round = l.currentAuctionRound;
            repossessorBid.bidAmount = 0;
            repossessorBid.collateralAmount = 0;
            repossessorBid.feeAmount = 0;
            repossessorBid.bidder = l.repossessor;

            l.highestBid = repossessorBid;
        } else {
            // Transfer bid to previous bidder's collateral
            l.bids[oldBidder].collateralAmount = l.highestBid.bidAmount;
        }

        // Reset auction
        l.currentBid = l.highestBid;
        l.bids[l.highestBid.bidder].collateralAmount = 0;
        l.currentBid.collateralAmount = 0;
        l.currentAuctionLength = l.auctionLengthSeconds;
        l.currentAuctionRound = l.currentAuctionRound + 1;

        // Transfer to highest bidder
        IStewardLicense(address(this)).triggerTransfer(
            oldBidder,
            l.highestBid.bidder,
            0
        );

        // Distribute fee to beneficiary
        if (l.highestBid.feeAmount > 0) {
            IBeneficiary(address(this)).distribute{
                value: l.highestBid.feeAmount
            }();
        }
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

        uint256 licensePeriod = IPeriodicPCOParamsReadable(address(this))
            .licensePeriod();

        if (l.lastPeriodEndTime > l.initialPeriodStartTime) {
            // Auction starts after licensePeriod has elapsed
            auctionStartTime = l.lastPeriodEndTime + licensePeriod;
        } else {
            // Auction starts at initial time
            auctionStartTime = l.initialPeriodStartTime;
        }
    }

    /**
     * @notice Get auction end time
     */
    function _auctionEndTime() internal view returns (uint256 auctionEndTime) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        auctionEndTime = _auctionStartTime() + l.currentAuctionLength;
    }

    /**
     * @notice Calculate fee from bid
     */
    function _calculateFeeFromBid(
        uint256 bidAmount
    ) internal view returns (uint256) {
        uint256 perSecondFeeNumerator = IPeriodicPCOParamsReadable(
            address(this)
        ).perSecondFeeNumerator();
        uint256 perSecondFeeDenominator = IPeriodicPCOParamsReadable(
            address(this)
        ).perSecondFeeDenominator();
        uint256 licensePeriod = IPeriodicPCOParamsReadable(address(this))
            .licensePeriod();

        return
            ((bidAmount * perSecondFeeNumerator) / perSecondFeeDenominator) *
            licensePeriod;
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
