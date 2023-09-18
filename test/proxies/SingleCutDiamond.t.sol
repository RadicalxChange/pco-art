// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { SingleCutDiamond } from '../../contracts/proxies/SingleCutDiamond.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';

contract TestSingleCutDiamond is SingleCutDiamond {
    constructor() SingleCutDiamond(new FacetInit[](0)) {}

    function echidna_selector_never_changes() public view returns (bool) {
        return
            address(
                bytes20(
                    DiamondBaseStorage.layout().facets[
                        IERC165.supportsInterface.selector
                    ]
                )
            ) == address(this);
    }
}
