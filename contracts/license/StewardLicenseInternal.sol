// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { StewardLicenseStorage } from './StewardLicenseStorage.sol';
import { ERC721Base, ERC721BaseInternal } from '@solidstate/contracts/token/ERC721/base/ERC721Base.sol';
import { ERC721Enumerable } from '@solidstate/contracts/token/ERC721/enumerable/ERC721Enumerable.sol';
import { ERC721Metadata } from '@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol';
import { ERC721MetadataStorage } from '@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { IAuction } from '../auction/IAuction.sol';

/**
 * @title StewardLicenseInternal
 */
abstract contract StewardLicenseInternal is
    ERC721Base,
    ERC721Enumerable,
    ERC721Metadata,
    ERC165Base
{
    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return StewardLicenseStorage.layout().isInitialized;
    }

    /**
     * @notice Disable transfers if during auction period
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721BaseInternal, ERC721Metadata) {
        // Delegatecall to facet
        bytes4 functionSelector = IAuction.isAuctionPeriod.selector;
        address facet = address(
            bytes20(DiamondBaseStorage.layout().facets[functionSelector])
        );
        bytes memory functionCall = abi.encodeWithSelector(functionSelector, 4);
        (bool success, bytes memory result) = address(facet).delegatecall(
            functionCall
        );
        require(success, 'StewardLicenseFacet: isAuctionPeriod() failed');

        bool isAuctionPeriod = abi.decode(result, (bool));
        require(
            isAuctionPeriod == false,
            'StewardLicenseFacet: Cannot transfer during auction period'
        );

        super._beforeTokenTransfer(from, to, tokenId);
    }
}
