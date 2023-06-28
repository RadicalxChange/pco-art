// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPeriodicPCOParamsInternal
 */
interface IPeriodicPCOParamsInternal {
    event LicensePeriodSet(uint256 licensePeriod);
    event PerSecondFeeNumeratorSet(uint256 perSecondFeeNumerator);
    event PerSecondFeeDenominatorSet(uint256 perSecondFeeDenominator);
}
