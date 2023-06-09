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
        uint256 _licensePeriod,
        uint256 _initialPeriodStartTime,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.isInitialized = true;

        _setLicensePeriod(_licensePeriod);
        _setInitialPeriodStartTime(_initialPeriodStartTime);
        _setPerSecondFeeNumerator(_perSecondFeeNumerator);
        _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return PeriodicPCOParamsStorage.layout().isInitialized;
    }

    /**
     * @notice Set initial period start time
     */
    function _setInitialPeriodStartTime(
        uint256 _initialPeriodStartTime
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.initialPeriodStartTime = _initialPeriodStartTime;
    }

    /**
     * @notice Set license period
     */
    function _setLicensePeriod(uint256 _licensePeriod) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.licensePeriod = _licensePeriod;
    }

    /**
     * @notice Set fee numerator
     */
    function _setPerSecondFeeNumerator(
        uint256 _perSecondFeeNumerator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();

        l.perSecondFeeNumerator = _perSecondFeeNumerator;
    }

    /**
     * @notice Set fee denominator
     */
    function _setPerSecondFeeDenominator(
        uint256 _perSecondFeeDenominator
    ) internal {
        PeriodicPCOParamsStorage.Layout storage l = PeriodicPCOParamsStorage
            .layout();
        l.perSecondFeeDenominator = _perSecondFeeDenominator;
    }
}
