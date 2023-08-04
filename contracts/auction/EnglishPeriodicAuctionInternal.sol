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
        uint256 initialPeriodStartTimeOffset,
        uint256 startingBid,
        uint256 auctionLengthSeconds,
        uint256 minBidIncrement,
        uint256 bidExtensionWindowLengthSeconds,
        uint256 bidExtensionSeconds
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        l.isInitialized = true;
        l.initialBidder = initialBidder;
        l.initialPeriodStartTimeOffset = initialPeriodStartTimeOffset;
        l.initialPeriodStartTime = initialPeriodStartTime;
        _setStartingBid(startingBid);
        _setRepossessor(repossessor);
        _setAuctionLengthSeconds(auctionLengthSeconds);
        _setMinBidIncrement(minBidIncrement);
        _setBidExtensionWindowLengthSeconds(bidExtensionWindowLengthSeconds);
        _setBidExtensionSeconds(bidExtensionSeconds);
    }

    /**
     * @notice Set auction parameters
     */
    function _setAuctionParameters(
        address repossessor,
        uint256 auctionLengthSeconds,
        uint256 minBidIncrement,
        uint256 bidExtensionWindowLengthSeconds,
        uint256 bidExtensionSeconds,
        uint256 startingBid
    ) internal {
        _setRepossessor(repossessor);
        _setAuctionLengthSeconds(auctionLengthSeconds);
        _setMinBidIncrement(minBidIncrement);
        _setBidExtensionWindowLengthSeconds(bidExtensionWindowLengthSeconds);
        _setBidExtensionSeconds(bidExtensionSeconds);
        _setStartingBid(startingBid);
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return EnglishPeriodicAuctionStorage.layout().isInitialized;
    }

    /**
     * @notice Get starting bid
     */
    function _startingBid() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().startingBid;
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

        emit RepossessorSet(repossessor);
    }

    /**
     * @notice Get initial period start time
     */
    function _initialPeriodStartTime() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().initialPeriodStartTime;
    }

    /**
     * @notice Get auction length
     */
    function _auctionLengthSeconds() internal view returns (uint256) {
        return EnglishPeriodicAuctionStorage.layout().auctionLengthSeconds;
    }

    /**
     * @notice Set starting bid
     */
    function _setStartingBid(uint256 startingBid) internal {
        EnglishPeriodicAuctionStorage.layout().startingBid = startingBid;

        emit StartingBidSet(startingBid);
    }

    /**
     * @notice Set auction length
     */
    function _setAuctionLengthSeconds(uint256 auctionLengthSeconds) internal {
        EnglishPeriodicAuctionStorage
            .layout()
            .auctionLengthSeconds = auctionLengthSeconds;

        emit AuctionLengthSet(auctionLengthSeconds);
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

        emit MinBidIncrementSet(minBidIncrement);
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

        emit BidExtensionWindowLengthSet(bidExtensionWindowLengthSeconds);
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

        emit BidExtensionSet(bidExtensionSeconds);
    }

    /**
     * @notice Get initial bidder
     */
    function _initialBidder() internal view returns (address) {
        return EnglishPeriodicAuctionStorage.layout().initialBidder;
    }

    /**
     * @notice Get highest outstanding bid
     */
    function _highestBid(uint256 tokenId) internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().highestBids[tokenId];
    }

    /**
     * @notice Get current bid
     */
    function _currentBid(uint256 tokenId) internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().currentBids[tokenId];
    }

    /**
     * @notice Get bid for address
     */
    function _bidOf(
        uint256 tokenId,
        address bidder
    ) internal view returns (Bid storage) {
        return EnglishPeriodicAuctionStorage.layout().bids[tokenId][bidder];
    }

    /**
     * @notice Get is auction period
     */
    function _isAuctionPeriod(uint256 tokenId) internal view returns (bool) {
        if (tokenId >= IStewardLicense(address(this)).maxTokenCount()) {
            return false;
        }
        return block.timestamp >= _auctionStartTime(tokenId);
    }

    /**
     * @notice Is token ready for transfer
     */
    function _isReadyForTransfer(uint256 tokenId) internal view returns (bool) {
        if (tokenId >= IStewardLicense(address(this)).maxTokenCount()) {
            return false;
        }
        return block.timestamp >= _auctionEndTime(tokenId);
    }

    /**
     * @notice Place a bid
     */
    function _placeBid(
        uint256 tokenId,
        address bidder,
        uint256 bidAmount,
        uint256 collateralAmount
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        Bid storage bid = l.bids[tokenId][bidder];

        // Check if higher than starting bid
        require(
            bidAmount >= l.startingBid,
            'EnglishPeriodicAuction: Bid amount must be greater than or equal to starting bid'
        );

        if (l.highestBids[tokenId].round == l.currentAuctionRound[tokenId]) {
            // Check if highest bid
            require(
                bidAmount >=
                    l.highestBids[tokenId].bidAmount + l.minBidIncrement,
                'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid'
            );
        }

        uint256 totalCollateralAmount;
        if (bid.round == l.currentAuctionRound[tokenId]) {
            // If bidder has bid for round, add to existing bid
            totalCollateralAmount = bid.collateralAmount + collateralAmount;
        } else {
            totalCollateralAmount = collateralAmount;
        }

        uint256 feeAmount;
        address currentBidder;
        if (IStewardLicense(address(this)).exists(tokenId)) {
            currentBidder = IStewardLicense(address(this)).ownerOf(tokenId);
        } else {
            currentBidder = l.initialBidder;
        }

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
        bid.round = l.currentAuctionRound[tokenId];
        bid.feeAmount = feeAmount;
        bid.collateralAmount = totalCollateralAmount;

        l.highestBids[tokenId] = bid;

        emit BidPlaced(tokenId, bid.round, bid.bidder, bid.bidAmount);

        // Check if auction should extend
        uint256 auctionEndTime = _auctionEndTime(tokenId);

        if (
            auctionEndTime >= block.timestamp &&
            auctionEndTime - block.timestamp <
            _bidExtensionWindowLengthSeconds()
        ) {
            uint256 auctionLengthSeconds;
            if (l.currentAuctionLength[tokenId] == 0) {
                auctionLengthSeconds = _auctionLengthSeconds();
            } else {
                auctionLengthSeconds = l.currentAuctionLength[tokenId];
            }
            // Extend auction
            l.currentAuctionLength[tokenId] =
                auctionLengthSeconds +
                _bidExtensionSeconds();
        }
    }

    /**
     * @notice Withdraw bid collateral if not highest bidder
     */
    function _withdrawBid(uint256 tokenId, address bidder) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        address currentBidder;
        if (IStewardLicense(address(this)).exists(tokenId)) {
            currentBidder = IStewardLicense(address(this)).ownerOf(tokenId);
        } else {
            currentBidder = l.initialBidder;
        }

        require(
            bidder != l.highestBids[tokenId].bidder,
            'EnglishPeriodicAuction: Cannot withdraw bid if highest bidder'
        );

        Bid storage bid = l.bids[tokenId][bidder];

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
    function _closeAuction(uint256 tokenId) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        address oldBidder;
        if (IStewardLicense(address(this)).exists(tokenId)) {
            oldBidder = IStewardLicense(address(this)).ownerOf(tokenId);
        } else {
            oldBidder = l.initialBidder;
        }

        // Set lastPeriodEndTime to the end of the current auction period
        l.lastPeriodEndTime[tokenId] = block.timestamp;

        if (
            l.highestBids[tokenId].round < l.currentAuctionRound[tokenId] ||
            l.highestBids[tokenId].bidder == address(0)
        ) {
            // No bids were placed, transfer to repossessor
            Bid storage repossessorBid = l.bids[tokenId][l.repossessor];
            repossessorBid.round = l.currentAuctionRound[tokenId];
            repossessorBid.bidAmount = 0;
            repossessorBid.collateralAmount = 0;
            repossessorBid.feeAmount = 0;
            repossessorBid.bidder = l.repossessor;

            l.highestBids[tokenId] = repossessorBid;
        } else {
            // Transfer bid to previous bidder's collateral
            l.bids[tokenId][oldBidder].collateralAmount += l
                .highestBids[tokenId]
                .bidAmount;
        }

        emit AuctionClosed(
            tokenId,
            l.currentAuctionRound[tokenId],
            l.highestBids[tokenId].bidder,
            oldBidder,
            l.highestBids[tokenId].bidAmount
        );

        // Reset auction
        l.currentBids[tokenId] = l.highestBids[tokenId];
        l.bids[tokenId][l.highestBids[tokenId].bidder].collateralAmount = 0;
        l.currentBids[tokenId].collateralAmount = 0;
        l.currentAuctionLength[tokenId] = l.auctionLengthSeconds;
        l.currentAuctionRound[tokenId] = l.currentAuctionRound[tokenId] + 1;

        // Transfer to highest bidder
        IStewardLicense(address(this)).triggerTransfer(
            oldBidder,
            l.highestBids[tokenId].bidder,
            tokenId
        );

        // Distribute fee to beneficiary
        if (l.highestBids[tokenId].feeAmount > 0) {
            IBeneficiary(address(this)).distribute{
                value: l.highestBids[tokenId].feeAmount
            }();
        }
    }

    /**
     * @notice Get auction start time
     */
    function _auctionStartTime(
        uint256 tokenId
    ) internal view returns (uint256 auctionStartTime) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 licensePeriod = IPeriodicPCOParamsReadable(address(this))
            .licensePeriod();

        if (l.lastPeriodEndTime[tokenId] > l.initialPeriodStartTime) {
            // Auction starts after licensePeriod has elapsed
            auctionStartTime = l.lastPeriodEndTime[tokenId] + licensePeriod;
        } else {
            // Auction starts at initial time
            auctionStartTime =
                l.initialPeriodStartTime +
                (tokenId * l.initialPeriodStartTimeOffset);
        }
    }

    /**
     * @notice Get auction end time
     */
    function _auctionEndTime(
        uint256 tokenId
    ) internal view returns (uint256 auctionEndTime) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 auctionLengthSeconds;
        if (l.currentAuctionLength[tokenId] == 0) {
            auctionLengthSeconds = _auctionLengthSeconds();
        } else {
            auctionLengthSeconds = l.currentAuctionLength[tokenId];
        }

        auctionEndTime = _auctionStartTime(tokenId) + auctionLengthSeconds;
    }

    /**
     * @notice Calculate fee from bid
     */
    function _calculateFeeFromBid(
        uint256 bidAmount
    ) internal view returns (uint256) {
        uint256 feeNumerator = IPeriodicPCOParamsReadable(address(this))
            .feeNumerator();
        uint256 feeDenominator = IPeriodicPCOParamsReadable(address(this))
            .feeDenominator();

        return (bidAmount * feeNumerator) / feeDenominator;
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
