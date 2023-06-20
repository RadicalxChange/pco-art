// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IIDABeneficiary } from '../IIDABeneficiary.sol';
import { IDABeneficiaryInternal } from '../IDABeneficiaryInternal.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { AccessControlInternal } from '@solidstate/contracts/access/access_control/AccessControlInternal.sol';

/**
 * @title AccessControlIDABeneficiaryFacet
 * @dev Beneficiary implemented using a Superfluid IDA index
 */
contract AccessControlIDABeneficiaryFacet is
    IIDABeneficiary,
    IDABeneficiaryInternal,
    AccessControlInternal,
    ERC165Base
{
    using SuperTokenV1Library for ISETH;

    // Component role
    bytes32 internal constant COMPONENT_ROLE =
        keccak256('AccessControlIDABeneficiaryFacet.COMPONENT_ROLE');

    /**
     * @notice Initialize beneficiary
     */
    function initializeIDABeneficiary(
        address _owner,
        ISETH _token,
        Beneficiary[] memory _beneficiaries
    ) external {
        require(
            _isInitialized() == false,
            'AccessControlIDABeneficiaryFacet: already initialized'
        );

        _setSupportsInterface(type(IIDABeneficiary).interfaceId, true);
        _grantRole(COMPONENT_ROLE, _owner);
        _initializeIDABeneficiary(_token, _beneficiaries);
    }

    /**
     * @notice Update beneficiaries
     */
    function updateBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) external onlyRole(COMPONENT_ROLE) {
        _updateBeneficiaryUnits(_beneficiaries);
    }

    /**
     * @notice Distribute to beneficiaries
     */
    function distribute() external payable {
        require(
            msg.value > 0,
            'ImmutableIDABeneficiaryFacet: msg.value should be greater than 0'
        );

        _distribute(msg.value);
    }
}
