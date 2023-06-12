// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IAuction
 */
interface IAuction {
    function isAuctionPeriod() external view returns (bool);
}
