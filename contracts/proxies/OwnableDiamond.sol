// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { ISolidStateDiamond } from '@solidstate/contracts/proxy/diamond/ISolidStateDiamond.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC173 } from '@solidstate/contracts/interfaces/IERC173.sol';
import { ERC165Base, ERC165BaseStorage } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { DiamondBase } from '@solidstate/contracts/proxy/diamond/base/DiamondBase.sol';
import { DiamondReadable, IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/DiamondReadable.sol';
import { DiamondWritable, IDiamondWritable } from '@solidstate/contracts/proxy/diamond/writable/DiamondWritable.sol';
import { DiamondFallback, IDiamondFallback } from '@solidstate/contracts/proxy/diamond/fallback/DiamondFallback.sol';
import { SafeOwnable } from '@solidstate/contracts/access/ownable/SafeOwnable.sol';
import { Ownable, OwnableInternal } from '@solidstate/contracts/access/ownable/Ownable.sol';
import { IDiamond } from './IDiamond.sol';

contract OwnableDiamond is
    ISolidStateDiamond,
    DiamondBase,
    DiamondFallback,
    DiamondReadable,
    DiamondWritable,
    SafeOwnable,
    IDiamond,
    ERC165Base
{
    constructor(address owner, FacetInit[] memory facetInits) {
        bytes4[] memory selectors = new bytes4[](12);
        uint256 selectorIndex = 0;

        // register DiamondFallback

        selectors[selectorIndex++] = IDiamondFallback
            .getFallbackAddress
            .selector;
        selectors[selectorIndex++] = IDiamondFallback
            .setFallbackAddress
            .selector;

        _setSupportsInterface(type(IDiamondFallback).interfaceId, true);

        // register DiamondWritable

        selectors[selectorIndex++] = IDiamondWritable.diamondCut.selector;

        _setSupportsInterface(type(IDiamondWritable).interfaceId, true);

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

        // register SafeOwnable

        selectors[selectorIndex++] = Ownable.owner.selector;
        selectors[selectorIndex++] = SafeOwnable.nomineeOwner.selector;
        selectors[selectorIndex++] = Ownable.transferOwnership.selector;
        selectors[selectorIndex++] = SafeOwnable.acceptOwnership.selector;

        _setSupportsInterface(type(IERC173).interfaceId, true);

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

        // set owner
        _setOwner(owner);
    }

    receive() external payable {}

    function _transferOwnership(
        address account
    ) internal virtual override(OwnableInternal, SafeOwnable) {
        super._transferOwnership(account);
    }

    /**
     * @inheritdoc DiamondFallback
     */
    function _getImplementation()
        internal
        view
        override(DiamondBase, DiamondFallback)
        returns (address implementation)
    {
        implementation = super._getImplementation();
    }
}
