// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/******************************************************************************\
* EIP-2535 Diamonds implementation that uses an external IDiamondReadable to store facet addresses.
* Can be used to store a single set of facet addresses for many diamonds
/******************************************************************************/

import { IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol';
import { Proxy } from '@solidstate/contracts/proxy/Proxy.sol';
import { BeaconDiamondStorage } from './BeaconDiamondStorage.sol';
import { BeaconDiamondInternal } from './BeaconDiamondInternal.sol';

contract BeaconDiamond is Proxy, BeaconDiamondInternal {
    error BeaconDiamond__NoFacetForSignature();

    constructor(IDiamondReadable _beacon) {
        _setBeacon(_beacon);
    }

    function _getImplementation() internal view override returns (address) {
        BeaconDiamondStorage.Layout storage l = BeaconDiamondStorage.layout();

        address implementation = l.beacon.facetAddress(msg.sig);

        if (implementation == address(0)) {
            revert BeaconDiamond__NoFacetForSignature();
        }

        return implementation;
    }
}
