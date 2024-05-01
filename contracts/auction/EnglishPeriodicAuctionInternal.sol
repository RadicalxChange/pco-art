// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

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
    function _highestBid(
        uint256 tokenId,
        uint256 round
    ) internal view returns (Bid storage) {
        return
            EnglishPeriodicAuctionStorage.layout().highestBids[tokenId][round];
    }

    /**
     * @notice Get bid for address
     */
    function _bidOf(
        uint256 tokenId,
        uint256 round,
        address bidder
    ) internal view returns (Bid storage) {
        return
            EnglishPeriodicAuctionStorage.layout().bids[tokenId][round][bidder];
    }

    /**
     * @notice Get is auction period
     */
    function _isAuctionPeriod(uint256 tokenId) internal view returns (bool) {
        if (tokenId >= IStewardLicense(address(this)).maxTokenCount()) {
            return false;
        }
        //slither-disable-next-line timestamp
        return block.timestamp >= _auctionStartTime(tokenId);
    }

    /**
     * @notice Is token ready for transfer
     */
    function _isReadyForTransfer(uint256 tokenId) internal view returns (bool) {
        if (tokenId >= IStewardLicense(address(this)).maxTokenCount()) {
            return false;
        }
        //slither-disable-next-line timestamp
        return block.timestamp >= _auctionEndTime(tokenId);
    }

    /**
     * @notice Get current auction round
     */
    function _currentAuctionRound(
        uint256 tokenId
    ) internal view returns (uint256) {
        return
            EnglishPeriodicAuctionStorage.layout().currentAuctionRound[tokenId];
    }

    /**
     * @notice Get locked collateral from all bids
     */
    function _lockedCollateral(
        uint256 tokenId,
        address bidder
    ) internal view returns (uint256) {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 currentAuctionRound = l.currentAuctionRound[tokenId];
        uint256 lockedCollateral = 0;
        for (uint256 i = 0; i <= currentAuctionRound; i++) {
            Bid storage bid = l.bids[tokenId][i][bidder];
            lockedCollateral += bid.collateralAmount;
        }

        return lockedCollateral;
    }

    /**
     * @notice Get available collateral
     */
    function _availableCollateral(
        address bidder
    ) internal view returns (uint256) {
        return
            EnglishPeriodicAuctionStorage.layout().availableCollateral[bidder];
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

        uint256 currentAuctionRound = l.currentAuctionRound[tokenId];

        Bid storage bid = l.bids[tokenId][currentAuctionRound][bidder];

        // Check if higher than starting bid
        require(
            bidAmount >= l.startingBid,
            'EnglishPeriodicAuction: Bid amount must be greater than or equal to starting bid'
        );

        // Check if highest bid
        if (l.highestBids[tokenId][currentAuctionRound].bidAmount > 0) {
            require(
                bidAmount >=
                    l.highestBids[tokenId][currentAuctionRound].bidAmount +
                        l.minBidIncrement,
                'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid'
            );
        }

        uint256 totalCollateralAmount = bid.collateralAmount + collateralAmount;

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
        bid.feeAmount = feeAmount;
        bid.collateralAmount = totalCollateralAmount;

        l.highestBids[tokenId][currentAuctionRound] = bid;

        emit BidPlaced(tokenId, currentAuctionRound, bid.bidder, bid.bidAmount);

        // Check if auction should extend
        uint256 auctionEndTime = _auctionEndTime(tokenId);

        // slither-disable-start timestamp
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
        // slither-disable-end timestamp
    }

    /**
     * @notice Cancel bid for current round if not highest bidder
     */
    function _cancelBid(
        uint256 tokenId,
        uint256 round,
        address bidder
    ) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        address currentBidder;
        if (IStewardLicense(address(this)).exists(tokenId)) {
            currentBidder = IStewardLicense(address(this)).ownerOf(tokenId);
        } else {
            currentBidder = l.initialBidder;
        }

        require(
            bidder != l.highestBids[tokenId][round].bidder,
            'EnglishPeriodicAuction: Cannot cancel bid if highest bidder'
        );

        Bid storage bid = l.bids[tokenId][round][bidder];

        require(
            bid.collateralAmount > 0,
            'EnglishPeriodicAuction: No bid to cancel'
        );

        // Make collateral available to withdraw
        l.availableCollateral[bidder] += bid.collateralAmount;

        // Reset collateral and bid
        bid.collateralAmount = 0;
        bid.bidAmount = 0;
    }

    /**
     * @notice Cancel bids for all rounds
     */
    function _cancelAllBids(uint256 tokenId, address bidder) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 currentAuctionRound = l.currentAuctionRound[tokenId];

        for (uint256 i = 0; i <= currentAuctionRound; i++) {
            Bid storage bid = l.bids[tokenId][i][bidder];

            if (bid.collateralAmount > 0) {
                // Make collateral available to withdraw
                l.availableCollateral[bidder] += bid.collateralAmount;

                // Reset collateral and bid
                bid.collateralAmount = 0;
                bid.bidAmount = 0;
            }
        }
    }

    /**
     * @notice Withdraw collateral
     */
    function _withdrawCollateral(address bidder) internal {
        EnglishPeriodicAuctionStorage.Layout
            storage l = EnglishPeriodicAuctionStorage.layout();

        uint256 collateralAmount = l.availableCollateral[bidder];

        require(
            collateralAmount > 0,
            'EnglishPeriodicAuction: No collateral to withdraw'
        );

        // Make collateral unavailable to withdraw
        l.availableCollateral[bidder] = 0;

        // Transfer collateral back to bidder
        //slither-disable-next-line low-level-calls
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

        uint256 currentAuctionRound = l.currentAuctionRound[tokenId];

        address oldBidder;
        if (IStewardLicense(address(this)).exists(tokenId)) {
            oldBidder = IStewardLicense(address(this)).ownerOf(tokenId);
        } else {
            oldBidder = l.initialBidder;
        }

        // Set lastPeriodEndTime to the end of the current auction period
        uint256 licensePeriod = IPeriodicPCOParamsReadable(address(this))
            .licensePeriod();

        l.lastPeriodEndTime[tokenId] = block.timestamp;
        l.currentLicensePeriod[tokenId] = licensePeriod;

        if (l.highestBids[tokenId][currentAuctionRound].bidder == address(0)) {
            // No bids were placed, transfer to repossessor
            Bid storage repossessorBid = l.bids[tokenId][currentAuctionRound][
                l.repossessor
            ];
            repossessorBid.bidAmount = 0;
            repossessorBid.feeAmount = 0;
            repossessorBid.collateralAmount = 0;
            repossessorBid.bidder = l.repossessor;

            l.highestBids[tokenId][currentAuctionRound] = repossessorBid;
        } else if (
            l.highestBids[tokenId][currentAuctionRound].bidder != oldBidder
        ) {
            // Transfer bid to previous bidder's collateral
            l.availableCollateral[oldBidder] += l
            .highestBids[tokenId][currentAuctionRound].bidAmount;
            l.highestBids[tokenId][currentAuctionRound].collateralAmount = 0;
            l
            .bids[tokenId][currentAuctionRound][
                l.highestBids[tokenId][currentAuctionRound].bidder
            ].collateralAmount = 0;
        } else {
            l.highestBids[tokenId][currentAuctionRound].collateralAmount = 0;
            l
            .bids[tokenId][currentAuctionRound][oldBidder].collateralAmount = 0;
        }

        emit AuctionClosed(
            tokenId,
            currentAuctionRound,
            l.highestBids[tokenId][currentAuctionRound].bidder,
            oldBidder,
            l.highestBids[tokenId][currentAuctionRound].bidAmount
        );

        // Reset auction
        l.currentAuctionLength[tokenId] = 0;
        l.currentAuctionRound[tokenId] = l.currentAuctionRound[tokenId] + 1;

        // Transfer to highest bidder
        IStewardLicense(address(this)).triggerTransfer(
            oldBidder,
            l.highestBids[tokenId][currentAuctionRound].bidder,
            tokenId
        );

        // Distribute fee to beneficiary
        if (l.highestBids[tokenId][currentAuctionRound].feeAmount > 0) {
            IBeneficiary(address(this)).distribute{
                value: l.highestBids[tokenId][currentAuctionRound].feeAmount
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

        uint256 initialPeriodStartTime;
        uint256 initialPeriodStartTimeOffset;
        if (l.tokenInitialPeriodStartTime[tokenId] > 0) {
            initialPeriodStartTime = l.tokenInitialPeriodStartTime[tokenId];
            initialPeriodStartTimeOffset = 0;
        } else {
            initialPeriodStartTime = l.initialPeriodStartTime;
            initialPeriodStartTimeOffset = l.initialPeriodStartTimeOffset;
        }

        if (l.lastPeriodEndTime[tokenId] > initialPeriodStartTime) {
            // Auction starts after licensePeriod has elapsed
            auctionStartTime =
                l.lastPeriodEndTime[tokenId] +
                l.currentLicensePeriod[tokenId];
        } else {
            // Auction starts at initial time
            auctionStartTime =
                initialPeriodStartTime +
                (tokenId * initialPeriodStartTimeOffset);
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
