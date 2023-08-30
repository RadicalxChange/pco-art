// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';
import { SuperTokenV1Library } from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol';
import { IDABeneficiaryStorage } from './IDABeneficiaryStorage.sol';
import { IIDABeneficiaryInternal } from './IIDABeneficiaryInternal.sol';

/**
 * @title IDABeneficiaryInternal
 */
abstract contract IDABeneficiaryInternal is IIDABeneficiaryInternal {
    using SuperTokenV1Library for ISETH;

    /**
     * @notice Initialize beneficiary
     */
    function _initializeIDABeneficiary(
        ISETH _token,
        Beneficiary[] memory _beneficiaries
    ) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        l.isInitialized = true;

        _setToken(_token);
        _updateBeneficiaryUnits(_beneficiaries);
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return IDABeneficiaryStorage.layout().isInitialized;
    }

    /**
     * @notice Set token
     */
    function _setToken(ISETH _token) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        emit TokenSet(address(_token));

        l.token = _token;
        //slither-disable-next-line unused-return
        l.token.createIndex(0);
    }

    /**
     * @notice Update beneficiary units
     */
    function _updateBeneficiaryUnits(
        Beneficiary[] memory _beneficiaries
    ) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        //slither-disable-start reentrancy-events
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            emit BeneficiaryUnitsUpdated(
                _beneficiaries[i].subscriber,
                _beneficiaries[i].units
            );

            //slither-disable-next-line unused-return
            l.token.updateSubscriptionUnits(
                0,
                _beneficiaries[i].subscriber,
                _beneficiaries[i].units
            );
        }
        //slither-disable-end reentrancy-events
    }

    /**
     * @notice Distribute to beneficiaries
     */
    function _distribute(uint256 value) internal {
        IDABeneficiaryStorage.Layout storage l = IDABeneficiaryStorage.layout();

        emit Distributed(value);

        // Wrap ETH
        l.token.upgradeByETH{ value: value }();

        // Distribute to beneficiaries
        //slither-disable-next-line unused-return
        l.token.distribute(0, value);
    }
}
