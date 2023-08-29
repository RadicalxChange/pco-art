// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IBeneficiary } from '../IBeneficiary.sol';
import { OwnableInternal } from '@solidstate/contracts/access/ownable/OwnableInternal.sol';

contract BeneficiaryMock is IBeneficiary, OwnableInternal {
    /**
     * @notice Initialize beneficiary
     */
    function initializeMockBeneficiary(address _owner) external {
        _setOwner(_owner);
    }

    /**
     * @notice Distribute to beneficiaries
     */
    function distribute() external payable {
        (bool success, ) = _owner().call{ value: msg.value }('');
        require(success, 'BeneficiaryMock: distribute failed');
    }
}
