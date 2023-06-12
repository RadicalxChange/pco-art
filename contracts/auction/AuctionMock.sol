// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IAuction } from './IAuction.sol';

contract AuctionMock is IAuction {
    struct Layout {
        bool isAuctionPeriod;
        bool shouldFail;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.AuctionMock');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function isAuctionPeriod() external view returns (bool) {
        require(!layout().shouldFail, 'AuctionMock: failed');
        return layout().isAuctionPeriod;
    }

    function setIsAuctionPeriod(bool _isAuctionPeriod) external {
        layout().isAuctionPeriod = _isAuctionPeriod;
    }

    function setShouldFail(bool _shouldFail) external {
        layout().shouldFail = _shouldFail;
    }
}
