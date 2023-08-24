// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IPeriodicPCOParamsReadable
 */
interface IPeriodicPCOParamsReadable {
    /**
     * @notice Get license period
     */
    function licensePeriod() external view returns (uint256);

    /**
     * @notice Get fee numerator
     */
    function feeNumerator() external view returns (uint256);

    /**
     * @notice Get fee denominator
     */
    function feeDenominator() external view returns (uint256);
}
