// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicPCOParamsReadable
 */
interface IPeriodicPCOParamsReadable {
    /**
     * @notice Get initial period start time
     */
    function initialPeriodStartTime() external view returns (uint256);

    /**
     * @notice Get license period
     */
    function licensePeriod() external view returns (uint256);

    /**
     * @notice Get fee numerator
     */
    function perSecondFeeNumerator() external view returns (uint256);

    /**
     * @notice Get fee denominator
     */
    function perSecondFeeDenominator() external view returns (uint256);
}
