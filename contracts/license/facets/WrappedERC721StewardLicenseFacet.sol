// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC721Base, ERC721BaseInternal } from '@solidstate/contracts/token/ERC721/base/ERC721Base.sol';
import { ERC721Enumerable } from '@solidstate/contracts/token/ERC721/enumerable/ERC721Enumerable.sol';
import { ERC721Metadata } from '@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol';
import { IERC721Metadata } from '@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol';
import { ERC721MetadataStorage } from '@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol';
import { IERC721Receiver } from '@solidstate/contracts/interfaces/IERC721Receiver.sol';
import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { StewardLicenseInternal } from '../StewardLicenseInternal.sol';
import { WrappedStewardLicenseInternal } from '../WrappedStewardLicenseInternal.sol';
import { StewardLicenseBase } from '../StewardLicenseBase.sol';

/**
 * @title WrappedERC721StewardLicenseFacet
 * @dev ERC-721 token license for Steward that wraps existing ERC-721. Only a particular ERC721 transfer is accepted.
 */
contract WrappedERC721StewardLicenseFacet is
    StewardLicenseInternal,
    WrappedStewardLicenseInternal,
    StewardLicenseBase,
    IERC721Receiver
{
    /**
     * @notice Initialize license
     */
    function initializeWrappedStewardLicense(
        address tokenAddress,
        uint256 tokenId,
        address _minter,
        address _addToCollectionMinter,
        address _steward,
        uint256 _maxTokenCount,
        bool shouldMint,
        string memory name,
        string memory symbol,
        string memory tokenURI
    ) external {
        require(
            _isInitialized() == false,
            'WrappedERC721StewardLicenseFacet: already initialized'
        );

        _initializeWrappedLicense(tokenAddress, tokenId);
        _initializeStewardLicense(
            _minter,
            _addToCollectionMinter,
            _steward,
            _maxTokenCount,
            shouldMint,
            name,
            symbol,
            tokenURI
        );
    }

    /**
     * @notice Get minter
     */
    function minter() external view returns (address) {
        return _minter();
    }

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external view override returns (bytes4) {
        require(
            _isInitialized() == true,
            'WrappedERC721StewardLicenseFacet: must be initialized'
        );

        require(
            msg.sender == _wrappedTokenAddress(),
            'WrappedERC721StewardLicenseFacet: cannot accept this token address'
        );

        require(
            tokenId == _wrappedTokenId(),
            'WrappedERC721StewardLicenseFacet: cannot accept this token ID'
        );

        return this.onERC721Received.selector;
    }
}
