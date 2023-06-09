// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { PeriodicPCOParamsStorage } from './PeriodicPCOParamsStorage.sol';

/**
 * @title PeriodicPCOParamsInternal
 */
abstract contract PeriodicPCOParamsInternal {
    /**
     * @notice Initialize parameters
     */
    function _initializeParams(
        uint256 licensePeriod,
        uint256 initialPeriodStartTime,
        uint256 perSecondFeeNumerator,
        uint256 perSecondFeeDenominator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.isInitialized = true;

        _setLicensePeriod(licensePeriod);
        _setInitialPeriodStartTime(initialPeriodStartTime);
        _setPerSecondFeeNumerator(perSecondFeeNumerator);
        _setPerSecondFeeDenominator(perSecondFeeDenominator);
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return PeriodicPCOParamsStorage.layout().isInitialized;
    }

    /**
     * @notice Get initial period start time
     */
    function _initialPeriodStartTime() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().initialPeriodStartTime;
    }

    /**
     * @notice Set initial period start time
     */
    function _setInitialPeriodStartTime(
        uint256 initialPeriodStartTime
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.initialPeriodStartTime = initialPeriodStartTime;
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
    }

    /**
     * @notice Get fee numerator
     */
    function _perSecondFeeNumerator() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().perSecondFeeNumerator;
    }

    /**
     * @notice Set fee numerator
     */
    function _setPerSecondFeeNumerator(uint256 perSecondFeeNumerator) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.perSecondFeeNumerator = perSecondFeeNumerator;
    }

    /**
     * @notice Get fee denominator
     */
    function _perSecondFeeDenominator() internal view returns (uint256) {
        return PeriodicPCOParamsStorage.layout().perSecondFeeDenominator;
    }

    /**
     * @notice Set fee denominator
     */
    function _setPerSecondFeeDenominator(
        uint256 perSecondFeeDenominator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();
        l.perSecondFeeDenominator = perSecondFeeDenominator;
    }
}
