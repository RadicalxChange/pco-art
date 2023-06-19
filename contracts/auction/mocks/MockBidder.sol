// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionFacet } from '../facets/EnglishPeriodicAuctionFacet.sol';

contract MockBidder {
    EnglishPeriodicAuctionFacet public auction;

    constructor(EnglishPeriodicAuctionFacet _auction) {
        auction = _auction;
    }

    // Withdraw bid
    function withdrawBid() external {
        auction.withdrawBid();
    }

    // Fail on receive
    receive() external payable {
        revert('MockBidder: receive not allowed');
    }
}
