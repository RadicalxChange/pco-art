// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicPCOParams
 */
interface IPeriodicPCOParams {
    /**
     * @notice Set license period
     */
    function setLicensePeriod(uint256 _licensePeriod) external;

    /**
     * @notice Set fee numerator
     */
    function setPerSecondFeeNumerator(uint256 _perSecondFeeNumerator) external;

    /**
     * @notice Set fee denominator
     */
    function setPerSecondFeeDenominator(
        uint256 _perSecondFeeDenominator
    ) external;
}
