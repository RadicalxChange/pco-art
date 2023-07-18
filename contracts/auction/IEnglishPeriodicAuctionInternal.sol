// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IEnglishPeriodicAuctionInternal
 */
interface IEnglishPeriodicAuctionInternal {
    struct Bid {
        uint256 round;
        address bidder;
        uint256 bidAmount;
        uint256 feeAmount;
        uint256 collateralAmount;
    }

    event InitialPeriodStartTimeSet(uint256 initialPeriodStartTime);
    event RepossessorSet(address repossessor);
    event AuctionLengthSet(uint256 auctionLengthSeconds);
    event MinBidIncrementSet(uint256 minBidIncrement);
    event BidExtensionWindowLengthSet(uint256 bidExtensionWindowLengthSeconds);
    event BidExtensionSet(uint256 bidExtensionSeconds);

    event BidPlaced(
        uint256 indexed tokenId,
        uint256 indexed round,
        address indexed bidder,
        uint256 bidAmount
    );
    event AuctionClosed(
        uint256 indexed tokenId,
        uint256 indexed round,
        address indexed winningBidder,
        address previousOwner,
        uint256 bidAmount
    );
}
