// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IDiamondReadable } from '@solidstate/contracts/proxy/diamond/readable/IDiamondReadable.sol';
import { BeaconDiamondStorage } from './BeaconDiamondStorage.sol';

abstract contract BeaconDiamondInternal {
    function _setBeacon(IDiamondReadable beacon) internal {
        BeaconDiamondStorage.Layout storage l = BeaconDiamondStorage.layout();
        l.beacon = beacon;
    }
}
