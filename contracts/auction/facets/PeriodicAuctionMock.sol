// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IPeriodicAuctionReadable } from '../IPeriodicAuctionReadable.sol';

contract PeriodicAuctionMock is IPeriodicAuctionReadable {
    struct Layout {
        bool isAuctionPeriod;
        bool shouldFail;
        uint256 initialPeriodStartTime;
        address initialBidder;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.PeriodicAuctionMock');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function isAuctionPeriod(uint256) external view returns (bool) {
        require(!layout().shouldFail, 'PeriodicAuctionMock: failed');
        return layout().isAuctionPeriod;
    }

    function setIsAuctionPeriod(bool _isAuctionPeriod) external {
        layout().isAuctionPeriod = _isAuctionPeriod;
    }

    function setShouldFail(bool _shouldFail) external {
        layout().shouldFail = _shouldFail;
    }

    function initialPeriodStartTime() external view returns (uint256) {
        return layout().initialPeriodStartTime;
    }

    function setInitialPeriodStartTime(
        uint256 _initialPeriodStartTime
    ) external {
        layout().initialPeriodStartTime = _initialPeriodStartTime;
    }

    function initialBidder() external view returns (address) {
        return layout().initialBidder;
    }

    function setInitialBidder(address _initialBidder) external {
        layout().initialBidder = _initialBidder;
    }
}
