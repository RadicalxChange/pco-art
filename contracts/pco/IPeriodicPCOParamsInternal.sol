// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IPeriodicPCOParamsInternal
 */
interface IPeriodicPCOParamsInternal {
    event LicensePeriodSet(uint256 licensePeriod);
    event FeeNumeratorSet(uint256 feeNumerator);
    event FeeDenominatorSet(uint256 feeDenominator);
}
