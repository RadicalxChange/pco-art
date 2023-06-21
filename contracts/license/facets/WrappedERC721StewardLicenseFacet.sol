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
import { IStewardLicense } from '../IStewardLicense.sol';
import { StewardLicenseBase } from '../StewardLicenseBase.sol';

/**
 * @title WrappedERC721StewardLicenseFacet
 * @dev ERC-721 token license for Steward that wraps existing ERC-721. Transfers are disabled during an auction.
 */
contract WrappedERC721StewardLicenseFacet is
    StewardLicenseInternal,
    IStewardLicense,
    StewardLicenseBase,
    IERC721Receiver
{
    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        require(
            _isInitialized() == false,
            'WrappedERC721StewardLicenseFacet: already initialized'
        );

        address steward = abi.decode(data, (address));

        _initializeStewardLicense(
            steward,
            IERC721Metadata(msg.sender).name(),
            IERC721Metadata(msg.sender).symbol(),
            IERC721Metadata(msg.sender).tokenURI(tokenId)
        );

        return this.onERC721Received.selector;
    }
}
