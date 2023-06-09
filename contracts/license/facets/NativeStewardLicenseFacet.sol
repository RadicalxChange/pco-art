// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC721Base, ERC721BaseInternal } from '@solidstate/contracts/token/ERC721/base/ERC721Base.sol';
import { ERC721Enumerable } from '@solidstate/contracts/token/ERC721/enumerable/ERC721Enumerable.sol';
import { ERC721Metadata } from '@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol';
import { ERC721MetadataStorage } from '@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { StewardLicenseInternal } from '../StewardLicenseInternal.sol';

/**
 * @title NativeStewardLicenseFacet
 * @dev ERC-721 token license for Steward. Transfers are disabled during an auction
 */
contract NativeStewardLicenseFacet is StewardLicenseInternal {
    /**
     * @notice Initialize license
     */
    function initializeStewardLicense(
        address _steward,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external {
        require(
            _isInitialized() == false,
            'StewardLicenseFacet: already initialized'
        );

        // Initialize ERC721
        ERC721MetadataStorage.Layout storage ls = ERC721MetadataStorage
            .layout();
        ls.name = name;
        ls.symbol = symbol;
        ls.baseURI = baseURI;

        _setSupportsInterface(type(IERC165).interfaceId, true);
        _setSupportsInterface(type(IERC721).interfaceId, true);

        // Mint single token to steward
        _mint(_steward, 0);
    }
}