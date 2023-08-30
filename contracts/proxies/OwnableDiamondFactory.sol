// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { ERC165Base, ERC165BaseStorage } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { DiamondBase } from '@solidstate/contracts/proxy/diamond/base/DiamondBase.sol';
import { DiamondReadable, IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/DiamondReadable.sol';
import { DiamondWritableInternal } from '@solidstate/contracts/proxy/diamond/writable/DiamondWritableInternal.sol';
import { OwnableDiamond } from './OwnableDiamond.sol';
import { IDiamondFactory } from './IDiamondFactory.sol';

contract OwnableDiamondFactory is IDiamondFactory {
    function createDiamond(
        FacetInit[] memory facetInits
    ) external returns (address) {
        OwnableDiamond ownableDiamond = new OwnableDiamond(
            msg.sender,
            facetInits
        );

        //slither-disable-next-line reentrancy-events
        emit DiamondCreated(address(ownableDiamond));

        return address(ownableDiamond);
    }
}
