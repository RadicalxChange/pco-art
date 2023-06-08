// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IBeneficiary } from './IBeneficiary.sol';
import { IDABeneficiaryInternal } from './IDABeneficiaryInternal.sol';

/**
 * @title ImmutableIDABeneficiaryFacet
 * @dev Beneficiary implemented using a Superfluid IDA index. Units are immutable after creation.
 */
contract ImmutableIDABeneficiaryFacet is IBeneficiary, IDABeneficiaryInternal {
    using SuperTokenV1Library for ISETH;

    /**
     * @notice Distribute to beneficiaries
     */
    function distribute() external payable {
        _distribute();
    }
}
