// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { ERC165Base, ERC165BaseStorage } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { DiamondBase } from '@solidstate/contracts/proxy/diamond/base/DiamondBase.sol';
import { DiamondReadable, IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/DiamondReadable.sol';
import { DiamondWritableInternal } from '@solidstate/contracts/proxy/diamond/writable/DiamondWritableInternal.sol';
import { IDiamond } from './IDiamond.sol';

/******************************************************************************\
* EIP-2535 Diamonds implementation that is a single cut with no diamondCut selector after deployment
/******************************************************************************/

contract SingleCutDiamond is
    DiamondBase,
    DiamondReadable,
    DiamondWritableInternal,
    ERC165Base,
    IDiamond
{
    constructor(FacetInit[] memory facetInits) {
        bytes4[] memory selectors = new bytes4[](5);
        uint256 selectorIndex = 0;

        // register DiamondReadable

        selectors[selectorIndex++] = IDiamondReadable.facets.selector;
        selectors[selectorIndex++] = IDiamondReadable
            .facetFunctionSelectors
            .selector;
        selectors[selectorIndex++] = IDiamondReadable.facetAddresses.selector;
        selectors[selectorIndex++] = IDiamondReadable.facetAddress.selector;

        _setSupportsInterface(type(IDiamondReadable).interfaceId, true);

        // register ERC165

        selectors[selectorIndex++] = IERC165.supportsInterface.selector;

        _setSupportsInterface(type(IERC165).interfaceId, true);

        // diamond cut

        FacetCut[] memory builtInFacetCuts = new FacetCut[](1);

        builtInFacetCuts[0] = FacetCut({
            target: address(this),
            action: FacetCutAction.ADD,
            selectors: selectors
        });

        _diamondCut(builtInFacetCuts, address(0), '');

        for (
            uint256 facetIndex = 0;
            facetIndex < facetInits.length;
            facetIndex++
        ) {
            FacetInit memory facetInit = facetInits[facetIndex];
            FacetCut[] memory facetCuts = new FacetCut[](1);
            facetCuts[0] = FacetCut({
                target: facetInit.target,
                action: FacetCutAction.ADD,
                selectors: facetInit.selectors
            });

            _diamondCut(facetCuts, facetInit.initTarget, facetInit.initData);
        }
    }

    receive() external payable {}
}
