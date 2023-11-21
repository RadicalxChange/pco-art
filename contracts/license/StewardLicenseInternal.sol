// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

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
import { AccessControlInternal } from '@solidstate/contracts/access/access_control/AccessControlInternal.sol';
import { EnglishPeriodicAuctionStorage } from '../auction/EnglishPeriodicAuctionStorage.sol';

/**
 * @title StewardLicenseInternal
 */
abstract contract StewardLicenseInternal is
    ERC721Base,
    ERC721Enumerable,
    ERC721Metadata,
    ERC165Base,
    AccessControlInternal
{
    using UintUtils for uint256;

    // Add token role
    bytes32 internal constant ADD_TOKEN_TO_COLLECTION_ROLE =
        keccak256('StewardLicenseBase.ADD_TOKEN_TO_COLLECTION_ROLE');

    /**
     * @notice Initialize license
     */
    function _initializeStewardLicense(
        address minter,
        address addToCollectionMinter,
        address initialSteward,
        uint256 maxTokenCount,
        bool shouldMint,
        string memory name,
        string memory symbol,
        string memory baseURI
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        l.isInitialized = true;
        l.initialSteward = initialSteward;
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
        _grantRole(ADD_TOKEN_TO_COLLECTION_ROLE, addToCollectionMinter);

        if (shouldMint) {
            // Mint tokens
            for (uint256 i = 0; i < maxTokenCount; i++) {
                _mint(initialSteward, i);
            }
        }
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
     * @notice Get initial steward
     */
    function _initialSteward() internal view returns (address) {
        return StewardLicenseStorage.layout().initialSteward;
    }

    /**
     * @notice Trigger transfer
     */
    function _triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        if (!_exists(tokenId)) {
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
        string memory tokenURI,
        uint256 tokenInitialPeriodStartTime
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        uint256 newTokenId = l.maxTokenCount;

        // Increment max token count
        l.maxTokenCount += 1;

        // Override metadata
        ERC721MetadataStorage.layout().tokenURIs[newTokenId] = tokenURI;

        // Override auction start time
        EnglishPeriodicAuctionStorage.layout().tokenInitialPeriodStartTime[
            newTokenId
        ] = tokenInitialPeriodStartTime;

        if (to != address(0)) {
            // Mint token
            _mint(to, newTokenId);
        }
    }

    /**
     * @notice Add token to collection
     */
    function _addTokenWithBaseURIToCollection(
        string memory _baseURI,
        bool shouldMint,
        uint256 tokenInitialPeriodStartTime
    ) internal {
        StewardLicenseStorage.Layout storage l = StewardLicenseStorage.layout();

        uint256 newTokenId = l.maxTokenCount;

        // Increment max token count
        l.maxTokenCount += 1;

        // Override metadata
        ERC721MetadataStorage.layout().tokenURIs[newTokenId] = string(
            abi.encodePacked(_baseURI, newTokenId.toString())
        );

        // Override auction start time
        EnglishPeriodicAuctionStorage.layout().tokenInitialPeriodStartTime[
            newTokenId
        ] = tokenInitialPeriodStartTime;

        if (shouldMint) {
            // Mint token
            _mint(l.initialSteward, newTokenId);
        }
    }

    /**
     * @notice Override token URI
     * @return token URI
     */
    function _tokenURI(
        uint256 tokenId
    ) internal view override returns (string memory) {
        StewardLicenseStorage.Layout storage licenseL = StewardLicenseStorage
            .layout();

        if (tokenId >= licenseL.maxTokenCount)
            revert ERC721Metadata__NonExistentToken();

        ERC721MetadataStorage.Layout storage metadataL = ERC721MetadataStorage
            .layout();

        string memory tokenIdURI = metadataL.tokenURIs[tokenId];
        string memory baseURI = metadataL.baseURI;

        if (bytes(tokenIdURI).length > 0) {
            return tokenIdURI;
        } else {
            return string(abi.encodePacked(baseURI, tokenId.toString()));
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
            // External call is to known contract
            //slither-disable-next-line calls-loop
            bool isAuctionPeriod = IPeriodicAuctionReadable(address(this))
                .isAuctionPeriod(tokenId);
            require(
                !isAuctionPeriod,
                'StewardLicenseFacet: Cannot transfer during auction period'
            );
        }

        super._beforeTokenTransfer(from, to, tokenId);
    }
}
