// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicAuction
 */
interface IPeriodicAuction {
    function isAuctionPeriod() external returns (bool);
}
