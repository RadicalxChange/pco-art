// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IPeriodicAuctionReadable
 */
interface IPeriodicAuctionReadable {
    /**
     * @notice Get is auction period
     */
    function isAuctionPeriod(uint256 tokenId) external view returns (bool);

    /**
     * @notice Get initial period start time
     */
    function initialPeriodStartTime() external view returns (uint256);

    /**
     * @notice Get initial bidder
     */
    function initialBidder() external view returns (address);
}
