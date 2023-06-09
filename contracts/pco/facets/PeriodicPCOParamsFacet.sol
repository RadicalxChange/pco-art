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
        address _owner,
        uint256 _licensePeriod,
        uint256 _initialPeriodStartTime,
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) external {
        require(
            _isInitialized() == false,
            'PeriodicPCOParamsFacet: already initialized'
        );

        _setOwner(_owner);
        _setLicensePeriod(_licensePeriod);
        _setInitialPeriodStartTime(_initialPeriodStartTime);
        _setPerSecondFeeNumerator(_perSecondFeeNumerator);
        _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }

    /**
     * @notice Get initial period start time
     */
    function initialPeriodStartTime() external view returns (uint256) {
        return _initialPeriodStartTime();
    }

    /**
     * @notice Get license period
     */
    function licensePeriod() external view returns (uint256) {
        return _licensePeriod();
    }

    /**
     * @notice Set license period
     */
    function setLicensePeriod(uint256 _licensePeriod) external onlyOwner {
        return _setLicensePeriod(_licensePeriod);
    }

    /**
     * @notice Get fee numerator
     */
    function perSecondFeeNumerator() external view returns (uint256) {
        return _perSecondFeeNumerator();
    }

    /**
     * @notice Set fee numerator
     */
    function setPerSecondFeeNumerator(
        uint256 _perSecondFeeNumerator
    ) external onlyOwner {
        return _setPerSecondFeeNumerator(_perSecondFeeNumerator);
    }

    /**
     * @notice Get fee denominator
     */
    function perSecondFeeDenominator() external view returns (uint256) {
        return _perSecondFeeDenominator();
    }

    /**
     * @notice Set fee denominator
     */
    function setPerSecondFeeDenominator(
        uint256 _perSecondFeeDenominator
    ) external onlyOwner {
        return _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }
}
