// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicAuctionReadable
 */
interface IPeriodicAuctionReadable {
    /**
     * @notice Get is auction period
     */
    function isAuctionPeriod() external view returns (bool);
}
