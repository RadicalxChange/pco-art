// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library EnglishPeriodicAuctionStorage {
    struct Layout {
        bool isInitialized;
        uint256 auctionLengthSeconds;
        uint256 minBidIncrement;
        uint256 bidExtensionWindowLengthSeconds;
        uint256 bidExtensionSeconds;
        uint256 lastPeriodEndTime;
        uint256 currentAuctionRound;
        mapping(address => Bid) bids;
        Bid currentBid;
        Bid highestOutstandingBid;
    }

    struct Bid {
        uint256 round;
        address bidder;
        uint256 amount;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.EnglishPeriodicAuctionStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
