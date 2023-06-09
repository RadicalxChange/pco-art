// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IPeriodicPCOParams } from '../IPeriodicPCOParams.sol';
import { PeriodicPCOParamsInternal } from '../PeriodicPCOParamsInternal.sol';
import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';

/**
 * @title PeriodicPCOParamsFacet
 * @dev Params store for periodic PCO
 */
contract PeriodicPCOParamsFacet is
    SafeOwnable,
    IPeriodicPCOParams,
    PeriodicPCOParamsInternal
{
    /**
     * @notice Initialize params
     */
    function initializePCOParams(
        uint256 _licensePeriod,
        uint256 _initialPeriodStartTime,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) external {
        require(
            _isInitialized() == false,
            'PeriodicPCOParamsFacet: already initialized'
        );

        _setLicensePeriod(_licensePeriod);
        _setInitialPeriodStartTime(_initialPeriodStartTime);
        _setPerSecondFeeNumerator(_perSecondFeeNumerator);
        _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }

    /**
     * @notice Set license period
     */
    function setLicensePeriod(uint256 _licensePeriod) external {
        return _setLicensePeriod(_licensePeriod);
    }

    /**
     * @notice Set fee numerator
     */
    function setPerSecondFeeNumerator(uint256 _perSecondFeeNumerator) external {
        return _setPerSecondFeeNumerator(_perSecondFeeNumerator);
    }

    /**
     * @notice Set fee denominator
     */
    function setPerSecondFeeDenominator(
        uint256 _perSecondFeeDenominator
    ) external {
        return _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }
}
