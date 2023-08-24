// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { EnglishPeriodicAuctionFacet } from '../facets/EnglishPeriodicAuctionFacet.sol';

contract MockBidder {
    EnglishPeriodicAuctionFacet public auction;

    constructor(EnglishPeriodicAuctionFacet _auction) {
        auction = _auction;
    }

    // Cancel bid
    function withdrawCollateral() external {
        auction.withdrawCollateral();
    }

    // Fail on receive
    receive() external payable {
        revert('MockBidder: receive not allowed');
    }
}
