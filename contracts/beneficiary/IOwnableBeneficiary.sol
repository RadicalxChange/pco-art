// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IBeneficiary } from './IBeneficiary.sol';
import { IOwnableBeneficiaryInternal } from './IOwnableBeneficiaryInternal.sol';

/**
 * @title IOwnableBeneficiary
 */
interface IOwnableBeneficiary is IBeneficiary, IOwnableBeneficiaryInternal {
    /**
     * @notice Update beneficiary units
     */
    function updateBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) external;
}
