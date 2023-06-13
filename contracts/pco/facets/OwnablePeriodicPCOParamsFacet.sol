// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IPeriodicPCOParams } from '../IPeriodicPCOParams.sol';
import { PeriodicPCOParamsInternal } from '../PeriodicPCOParamsInternal.sol';
import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';

/**
 * @title OwnablePeriodicPCOParamsFacet
 * @dev Params store for periodic PCO
 */
contract OwnablePeriodicPCOParamsFacet is
    SafeOwnable,
    IPeriodicPCOParams,
    PeriodicPCOParamsInternal,
    ERC165Base
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

        _setSupportsInterface(type(IPeriodicPCOParams).interfaceId, true);
        _setOwner(_owner);
        _initializeParams(
            _licensePeriod,
            _initialPeriodStartTime,
            _perSecondFeeNumerator,
            _perSecondFeeDenominator
        );
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
