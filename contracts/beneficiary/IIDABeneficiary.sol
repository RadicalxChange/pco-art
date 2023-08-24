// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IBeneficiary } from './IBeneficiary.sol';
import { IIDABeneficiaryInternal } from './IIDABeneficiaryInternal.sol';

/**
 * @title IIDABeneficiary
 */
interface IIDABeneficiary is IBeneficiary, IIDABeneficiaryInternal {
    /**
     * @notice Update beneficiary units
     */
    function updateBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) external;
}
