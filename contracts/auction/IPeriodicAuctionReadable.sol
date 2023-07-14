// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicAuctionReadable
 */
interface IPeriodicAuctionReadable {
    /**
     * @notice Get is auction period
     */
    function isAuctionPeriod(uint256 tokenId) external view returns (bool);
}
