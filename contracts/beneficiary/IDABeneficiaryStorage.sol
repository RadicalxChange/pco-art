// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ISETH } from '@superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/ISETH.sol';

/**
 * @title IDABeneficiaryStorage
 */
library IDABeneficiaryStorage {
    struct Layout {
        bool isInitialized;
        ISETH token;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.IDABeneficiaryStorage');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
