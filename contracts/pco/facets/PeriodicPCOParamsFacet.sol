// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IPeriodicPCOParamsReadable } from '../IPeriodicPCOParamsReadable.sol';
import { IPeriodicPCOParamsWritable } from '../IPeriodicPCOParamsWritable.sol';
import { PeriodicPCOParamsInternal } from '../PeriodicPCOParamsInternal.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { AccessControlInternal } from '@solidstate/contracts/access/access_control/AccessControlInternal.sol';

/**
 * @title PeriodicPCOParamsFacet
 * @dev Params store for periodic PCO
 */
contract PeriodicPCOParamsFacet is
    AccessControlInternal,
    IPeriodicPCOParamsReadable,
    IPeriodicPCOParamsWritable,
    PeriodicPCOParamsInternal,
    ERC165Base
{
    // Component role
    bytes32 internal constant COMPONENT_ROLE =
        keccak256('PeriodicPCOParamsFacet.COMPONENT_ROLE');

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

        _setSupportsInterface(
            type(IPeriodicPCOParamsReadable).interfaceId,
            true
        );
        _initializeParams(
            _licensePeriod,
            _initialPeriodStartTime,
            _perSecondFeeNumerator,
            _perSecondFeeDenominator
        );
    }

    /**
     * @notice Initialize params with owner
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

        _setSupportsInterface(
            type(IPeriodicPCOParamsReadable).interfaceId,
            true
        );
        _setSupportsInterface(
            type(IPeriodicPCOParamsWritable).interfaceId,
            true
        );
        _grantRole(COMPONENT_ROLE, _owner);
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
    function setLicensePeriod(
        uint256 _licensePeriod
    ) external onlyRole(COMPONENT_ROLE) {
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
    ) external onlyRole(COMPONENT_ROLE) {
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
    ) external onlyRole(COMPONENT_ROLE) {
        return _setPerSecondFeeDenominator(_perSecondFeeDenominator);
    }
}
