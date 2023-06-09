// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IOwnableBeneficiary } from '../IOwnableBeneficiary.sol';
import { IDABeneficiaryInternal } from '../IDABeneficiaryInternal.sol';
import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';

/**
 * @title OwnableIDABeneficiaryFacet
 * @dev Beneficiary implemented using a Superfluid IDA index
 */
contract OwnableIDABeneficiaryFacet is
    IOwnableBeneficiary,
    IDABeneficiaryInternal,
    SafeOwnable
{
    using SuperTokenV1Library for ISETH;

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
