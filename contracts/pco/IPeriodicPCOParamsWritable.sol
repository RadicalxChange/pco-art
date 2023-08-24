// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IPeriodicPCOParamsWritable
 */
interface IPeriodicPCOParamsWritable {
    /**
     * @notice Set license period
     */
    function setLicensePeriod(uint256 _licensePeriod) external;

    /**
     * @notice Set fee numerator
     */
    function setFeeNumerator(uint256 _feeNumerator) external;

    /**
     * @notice Set fee denominator
     */
    function setFeeDenominator(uint256 _feeDenominator) external;
}
