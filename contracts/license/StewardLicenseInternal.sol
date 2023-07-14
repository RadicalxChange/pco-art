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
import { IPeriodicAuctionReadable } from '../auction/IPeriodicAuctionReadable.sol';

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
     * @notice Initialize license
     */
    function _initializeStewardLicense(
        address _initialSteward,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        l.isInitialized = true;
        l.initialSteward = _initialSteward;

        // Initialize ERC721
        ERC721MetadataStorage.Layout storage ls = ERC721MetadataStorage
            .layout();
        ls.name = name;
        ls.symbol = symbol;
        ls.baseURI = baseURI;

        _setSupportsInterface(type(IERC165).interfaceId, true);
        _setSupportsInterface(type(IERC721).interfaceId, true);
    }

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
        // Disable transfers if not mint
        if (from != address(0x0)) {
            bool isAuctionPeriod = IPeriodicAuctionReadable(address(this))
                .isAuctionPeriod(tokenId);
            require(
                isAuctionPeriod == false,
                'StewardLicenseFacet: Cannot transfer during auction period'
            );
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }
}
