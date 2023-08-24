// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IDiamond } from './IDiamond.sol';

interface IDiamondFactory is IDiamond {
    event DiamondCreated(address indexed diamondAddress);

    function createDiamond(
        FacetInit[] memory facetInits
    ) external returns (address);
}
