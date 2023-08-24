// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { PeriodicPCOParamsStorage } from './PeriodicPCOParamsStorage.sol';
import { IPeriodicPCOParamsInternal } from './IPeriodicPCOParamsInternal.sol';

/**
 * @title PeriodicPCOParamsInternal
 */
abstract contract PeriodicPCOParamsInternal is IPeriodicPCOParamsInternal {
    /**
     * @notice Initialize parameters
     */
    function _initializeParams(
        uint256 licensePeriod,
        uint256 feeNumerator,
        uint256 feeDenominator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.isInitialized = true;

        _setLicensePeriod(licensePeriod);
        _setFeeNumerator(feeNumerator);
        _setFeeDenominator(feeDenominator);
    }

    /**
     * @notice Set PCO parameters
     */
    function _setPCOParameters(
        uint256 licensePeriod,
        uint256 feeNumerator,
        uint256 feeDenominator
    ) internal {
        _setLicensePeriod(licensePeriod);
        _setFeeNumerator(feeNumerator);
        _setFeeDenominator(feeDenominator);
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return PeriodicPCOParamsStorage.layout().isInitialized;
    }

    /**
     * @notice Get license period
     */
    function _licensePeriod() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().licensePeriod;
    }

    /**
     * @notice Set license period
     */
    function _setLicensePeriod(uint256 licensePeriod) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.licensePeriod = licensePeriod;

        emit LicensePeriodSet(licensePeriod);
    }

    /**
     * @notice Get fee numerator
     */
    function _feeNumerator() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().feeNumerator;
    }

    /**
     * @notice Set fee numerator
     */
    function _setFeeNumerator(uint256 feeNumerator) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.feeNumerator = feeNumerator;

        emit FeeNumeratorSet(feeNumerator);
    }

    /**
     * @notice Get fee denominator
     */
    function _feeDenominator() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().feeDenominator;
    }

    /**
     * @notice Set fee denominator
     */
    function _setFeeDenominator(uint256 feeDenominator) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();
        l.feeDenominator = feeDenominator;

        emit FeeDenominatorSet(feeDenominator);
    }
}
