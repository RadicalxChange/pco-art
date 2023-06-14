// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';

/**
 * @title FacetCallInternal
 * @dev Helper contract to delegate calls to facet contracts
 */
abstract contract FacetCallInternal {
    /**
     * @notice Call another facet deployed to the same diamond
     */
    function _callFacet(
        bytes4 functionSelector,
        bytes memory callData
    ) internal returns (bytes memory) {
        address facet = address(
            bytes20(DiamondBaseStorage.layout().facets[functionSelector])
        );
        bytes memory functionCall = abi.encode(functionSelector, callData);
        (bool success, bytes memory result) = address(facet).delegatecall(
            functionCall
        );
        require(success, 'FacetCallInternal: facet call failed');

        return result;
    }
}
