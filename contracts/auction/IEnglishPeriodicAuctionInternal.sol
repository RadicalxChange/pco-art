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
        uint256 collateralAmount;
    }
}
