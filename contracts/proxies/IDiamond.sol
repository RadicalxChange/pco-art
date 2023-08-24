// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IDiamond {
    struct FacetInit {
        address target;
        address initTarget;
        bytes initData;
        bytes4[] selectors;
    }
}
