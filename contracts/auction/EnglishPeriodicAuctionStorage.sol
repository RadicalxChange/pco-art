// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IEnglishPeriodicAuctionInternal } from './IEnglishPeriodicAuctionInternal.sol';

library EnglishPeriodicAuctionStorage {
    struct Layout {
        bool isInitialized;
        // Same for all tokens
        address initialBidder;
        uint256 startingBid;
        address repossessor;
        uint256 initialPeriodStartTime;
        uint256 initialPeriodStartTimeOffset;
        uint256 auctionLengthSeconds;
        uint256 minBidIncrement;
        uint256 bidExtensionWindowLengthSeconds;
        uint256 bidExtensionSeconds;
        // Per token config
        mapping(uint256 => uint256) tokenInitialPeriodStartTime;
        mapping(uint256 => uint256) lastPeriodEndTime;
        mapping(uint256 => uint256) currentLicensePeriod;
        mapping(uint256 => uint256) currentAuctionRound;
        mapping(uint256 => uint256) currentAuctionLength;
        mapping(uint256 => mapping(uint256 => mapping(address => IEnglishPeriodicAuctionInternal.Bid))) bids;
        mapping(uint256 => mapping(uint256 => IEnglishPeriodicAuctionInternal.Bid)) highestBids;
        mapping(address => uint256) availableCollateral;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.EnglishPeriodicAuctionStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        //slither-disable-next-line assembly
        assembly {
            l.slot := slot
        }
    }
}
