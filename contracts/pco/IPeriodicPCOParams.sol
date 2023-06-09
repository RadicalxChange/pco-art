// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicPCOParams
 */
interface IPeriodicPCOParams {
    /**
     * @notice Get initial period start time
     */
    function initialPeriodStartTime() external view returns (uint256);

    /**
     * @notice Get license period
     */
    function licensePeriod() external view returns (uint256);

    /**
     * @notice Set license period
     */
    function setLicensePeriod(uint256 _licensePeriod) external;

    /**
     * @notice Get fee numerator
     */
    function perSecondFeeNumerator() external view returns (uint256);

    /**
     * @notice Set fee numerator
     */
    function setPerSecondFeeNumerator(uint256 _perSecondFeeNumerator) external;

    /**
     * @notice Get fee denominator
     */
    function perSecondFeeDenominator() external view returns (uint256);

    /**
     * @notice Set fee denominator
     */
    function setPerSecondFeeDenominator(
        uint256 _perSecondFeeDenominator
    ) external;
}
