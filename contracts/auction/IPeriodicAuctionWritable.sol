// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IPeriodicAuctionWritable
 */
interface IPeriodicAuctionWritable {
    /**
     * @notice Set repossessor
     */
    function setRepossessor(address _repossessor) external;

    /**
     * @notice Set auction length
     */
    function setAuctionLengthSeconds(uint256 _auctionLengthSeconds) external;

    /**
     * @notice Set minimum bid increment
     */
    function setMinBidIncrement(uint256 _minBidIncrement) external;

    /**
     * @notice Set bid extension window length
     */
    function setBidExtensionWindowLengthSeconds(
        uint256 _bidExtensionWindowLengthSeconds
    ) external;

    /**
     *  @notice Set bid extension seconds
     */
    function setBidExtensionSeconds(uint256 _bidExtensionSeconds) external;
}
