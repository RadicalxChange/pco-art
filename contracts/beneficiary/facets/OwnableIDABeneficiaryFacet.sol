// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IOwnableBeneficiary } from '../IOwnableBeneficiary.sol';
import { IDABeneficiaryInternal } from '../IDABeneficiaryInternal.sol';
import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';

/**
 * @title OwnableIDABeneficiaryFacet
 * @dev Beneficiary implemented using a Superfluid IDA index
 */
contract OwnableIDABeneficiaryFacet is
    IOwnableBeneficiary,
    IDABeneficiaryInternal,
    SafeOwnable,
    ERC165Base
{
    using SuperTokenV1Library for ISETH;

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
            'OwnableIDABeneficiaryFacet: already initialized'
        );

        _setSupportsInterface(type(IOwnableBeneficiary).interfaceId, true);
        _setOwner(_owner);
        _initializeIDABeneficiary(_token, _beneficiaries);
    }

    /**
     * @notice Update beneficiaries
     */
    function updateBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) external onlyOwner {
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
