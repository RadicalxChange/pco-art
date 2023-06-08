// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { IInstantDistributionAgreementV1 } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';

/**
 * @title ImmutableIDABeneficiaryFacet
 * @dev Beneficiary implemented using a Superfluid IDA index. Units are immutable after creation.
 */
contract ImmutableIDABeneficiaryFacet {
    using SuperTokenV1Library for ISETH;

    ISETH public token;

    struct Beneficiary {
        address subscriber;
        uint128 units;
    }

    constructor(ISETH _token, Beneficiary[] memory _beneficiaries) {
        token = _token;

        token.createIndex(0);

        // Add all beneficiaries
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            token.updateSubscriptionUnits(
                0,
                _beneficiaries[i].subscriber,
                _beneficiaries[i].units
            );
        }
    }

    /**
     * @notice Distribute to beneficiaries
     */
    function distribute() external payable {
        require(
            msg.value > 0,
            'ImmutableIDABeneficiaryFacet: msg.value should be greater than 0'
        );

        // Wrap ETH
        token.upgradeByETH{ value: msg.value }();

        // Distribute to beneficiaries
        token.distribute(0, msg.value);
    }
}
