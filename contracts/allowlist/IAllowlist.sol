// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IAllowlist
 */
interface IAllowlist {
    /**
     * @notice Check if address is allowed
     */
    function isAllowed(address _address) external view returns (bool);
}
