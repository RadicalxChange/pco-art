// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { ERC165Base, ERC165BaseStorage } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { DiamondBase } from '@solidstate/contracts/proxy/diamond/base/DiamondBase.sol';
import { DiamondReadable, IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/DiamondReadable.sol';
import { DiamondWritableInternal } from '@solidstate/contracts/proxy/diamond/writable/DiamondWritableInternal.sol';
import { SingleCutDiamond } from './SingleCutDiamond.sol';
import { IDiamondFactory } from './IDiamondFactory.sol';

contract SingleCutDiamondFactory is IDiamondFactory {
    function createDiamond(
        FacetInit[] memory facetInits
    ) external returns (address) {
        SingleCutDiamond singleCutDiamond = new SingleCutDiamond(facetInits);

        //slither-disable-next-line reentrancy-events
        emit DiamondCreated(address(singleCutDiamond));

        return address(singleCutDiamond);
    }
}
