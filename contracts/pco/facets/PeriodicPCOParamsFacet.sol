// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IPeriodicPCOParamsReadable } from '../IPeriodicPCOParamsReadable.sol';
import { IPeriodicPCOParamsWritable } from '../IPeriodicPCOParamsWritable.sol';
import { PeriodicPCOParamsInternal } from '../PeriodicPCOParamsInternal.sol';
import { ERC165BaseInternal } from '@solidstate/contracts/introspection/ERC165/base/ERC165BaseInternal.sol';
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
    ERC165BaseInternal
{
    // Component role
    bytes32 internal constant COMPONENT_ROLE =
        keccak256('PeriodicPCOParamsFacet.COMPONENT_ROLE');

    /**
     * @notice Initialize params
     */
    function initializePCOParams(
        uint256 licensePeriod_,
        uint256 feeNumerator_,
        uint256 feeDenominator_
    ) external {
        require(
            !_isInitialized(),
            'PeriodicPCOParamsFacet: already initialized'
        );

        _setSupportsInterface(
            type(IPeriodicPCOParamsReadable).interfaceId,
            true
        );
        _initializeParams(licensePeriod_, feeNumerator_, feeDenominator_);
    }

    /**
     * @notice Initialize params with owner
     */
    function initializePCOParams(
        address owner_,
        uint256 licensePeriod_,
        uint256 feeNumerator_,
        uint256 feeDenominator_
    ) external {
        require(
            !_isInitialized(),
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
        _grantRole(COMPONENT_ROLE, owner_);
        _initializeParams(licensePeriod_, feeNumerator_, feeDenominator_);
    }

    /**
     * @notice Set PCO parameters
     */
    function setPCOParameters(
        uint256 licensePeriod_,
        uint256 feeNumerator_,
        uint256 feeDenominator_
    ) external onlyRole(COMPONENT_ROLE) {
        _setPCOParameters(licensePeriod_, feeNumerator_, feeDenominator_);
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
        uint256 licensePeriod_
    ) external onlyRole(COMPONENT_ROLE) {
        return _setLicensePeriod(licensePeriod_);
    }

    /**
     * @notice Get fee numerator
     */
    function feeNumerator() external view returns (uint256) {
        return _feeNumerator();
    }

    /**
     * @notice Set fee numerator
     */
    function setFeeNumerator(
        uint256 feeNumerator_
    ) external onlyRole(COMPONENT_ROLE) {
        return _setFeeNumerator(feeNumerator_);
    }

    /**
     * @notice Get fee denominator
     */
    function feeDenominator() external view returns (uint256) {
        return _feeDenominator();
    }

    /**
     * @notice Set fee denominator
     */
    function setFeeDenominator(
        uint256 feeDenominator_
    ) external onlyRole(COMPONENT_ROLE) {
        return _setFeeDenominator(feeDenominator_);
    }
}
