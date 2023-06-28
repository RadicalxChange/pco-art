// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IEnglishPeriodicAuctionInternal } from './IEnglishPeriodicAuctionInternal.sol';

library EnglishPeriodicAuctionStorage {
    struct Layout {
        bool isInitialized;
        address repossessor;
        uint256 initialPeriodStartTime;
        uint256 auctionLengthSeconds;
        uint256 minBidIncrement;
        uint256 bidExtensionWindowLengthSeconds;
        uint256 bidExtensionSeconds;
        uint256 lastPeriodEndTime;
        uint256 currentAuctionRound;
        uint256 currentAuctionLength;
        mapping(address => IEnglishPeriodicAuctionInternal.Bid) bids;
        IEnglishPeriodicAuctionInternal.Bid currentBid;
        IEnglishPeriodicAuctionInternal.Bid highestBid;
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
