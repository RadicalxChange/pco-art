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
import { UintUtils } from '@solidstate/contracts/utils/UintUtils.sol';

/**
 * @title StewardLicenseInternal
 */
abstract contract StewardLicenseInternal is
    ERC721Base,
    ERC721Enumerable,
    ERC721Metadata,
    ERC165Base
{
    using UintUtils for uint256;

    /**
     * @notice Initialize license
     */
    function _initializeStewardLicense(
        address minter,
        address _initialSteward,
        uint256 maxTokenCount,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        l.isInitialized = true;
        l.initialSteward = _initialSteward;
        l.minter = minter;
        l.maxTokenCount = maxTokenCount;

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
     * @notice Get minter
     */
    function _minter() internal view returns (address) {
        return StewardLicenseStorage.layout().minter;
    }

    /**
     * @notice Trigger transfer
     */
    function _triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        if (_exists(tokenId) == false) {
            // Mint token
            _mint(to, tokenId);
        } else {
            // Safe transfer is not needed. If receiver does not implement ERC721Receiver, next auction can still happen. This prevents a failed transfer from locking up license
            _transfer(from, to, tokenId);
        }
    }

    /**
     * @notice Get max token count
     */
    function _maxTokenCount() internal view returns (uint256) {
        return StewardLicenseStorage.layout().maxTokenCount;
    }

    /**
     * @notice Add token to collection
     */
    function _addTokenToCollection(
        address to,
        string memory _tokenURI
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        uint256 newTokenId = l.maxTokenCount;

        // Increment max token count
        l.maxTokenCount += 1;

        // Override metadata
        l.tokenURIOverrides[newTokenId] = _tokenURI;

        if (to != address(0)) {
            // Mint token
            _mint(to, newTokenId);
        }
    }

    /**
     * @notice Add token to collection
     */
    function _addTokenWithBaseURIToCollection(string memory _baseURI) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        uint256 newTokenId = l.maxTokenCount;

        // Increment max token count
        l.maxTokenCount += 1;

        // Override metadata
        l.tokenURIOverrides[newTokenId] = string(
            abi.encodePacked(_baseURI, newTokenId.toString())
        );
    }

    /**
     * @notice Override token URI
     */
    function tokenURI(
        uint256 tokenId
    ) external view override returns (string memory) {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();
        string storage tokenIdURI = l.tokenURIOverrides[tokenId];

        if (bytes(tokenIdURI).length > 0) {
            return tokenIdURI;
        } else {
            return _tokenURI(tokenId);
        }
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
