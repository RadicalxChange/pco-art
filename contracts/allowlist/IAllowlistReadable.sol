// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IAllowlistReadable
 */
interface IAllowlistReadable {
    /**
     * @notice Check if address is allowed
     */
    function isAllowed(address _address) external view returns (bool);
}
