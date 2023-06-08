// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IDABeneficiaryStorage } from './IDABeneficiaryStorage.sol';

/**
 * @title IDABeneficiaryInternal
 */
abstract contract IDABeneficiaryInternal {
    using SuperTokenV1Library for ISETH;

    struct Beneficiary {
        address subscriber;
        uint128 units;
    }

    function _setToken(ISETH _token) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        l.token = _token;
        l.token.createIndex(0);
    }

    function _setBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            l.token.updateSubscriptionUnits(
                0,
                _beneficiaries[i].subscriber,
                _beneficiaries[i].units
            );
        }
    }

    /**
     * @notice Distribute to beneficiaries
     */
    function _distribute() internal {
        require(
            msg.value > 0,
            'IDABeneficiaryInternal: msg.value should be greater than 0'
        );

        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        // Wrap ETH
        l.token.upgradeByETH{ value: msg.value }();

        // Distribute to beneficiaries
        l.token.distribute(0, msg.value);
    }
}
