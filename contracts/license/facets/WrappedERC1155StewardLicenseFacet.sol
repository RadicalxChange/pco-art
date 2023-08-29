// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC1155 } from '@solidstate/contracts/interfaces/IERC1155.sol';
import { IERC1155Metadata } from '@solidstate/contracts/token/ERC1155/metadata/IERC1155Metadata.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { StewardLicenseInternal } from '../StewardLicenseInternal.sol';
import { StewardLicenseBase } from '../StewardLicenseBase.sol';
import { IERC1155Receiver } from '@solidstate/contracts/interfaces/IERC1155Receiver.sol';
import { WrappedStewardLicenseInternal } from '../WrappedStewardLicenseInternal.sol';

/**
 * @title WrappedERC1155StewardLicenseFacet
 * @dev ERC-721 token license for Steward that wraps existing ERC-1155. Transfers are disabled during an auction.
 */
contract WrappedERC1155StewardLicenseFacet is
    StewardLicenseInternal,
    WrappedStewardLicenseInternal,
    StewardLicenseBase,
    IERC1155Receiver
{
    /**
     * @notice Initialize license
     */
    function initializeWrappedStewardLicense(
        address tokenAddress,
        uint256 tokenId,
        address minter_,
        address addToCollectionMinter_,
        address steward_,
        uint256 maxTokenCount_,
        bool shouldMint,
        string memory name,
        string memory symbol,
        string memory tokenURI
    ) external {
        require(
            !_isInitialized(),
            'WrappedERC1155StewardLicenseFacet: already initialized'
        );

        _initializeWrappedLicense(tokenAddress, tokenId);
        _initializeStewardLicense(
            minter_,
            addToCollectionMinter_,
            steward_,
            maxTokenCount_,
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

    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 value,
        bytes calldata
    ) external view override returns (bytes4) {
        require(
            value == 1,
            'WrappedERC1155StewardLicenseFacet: can only receive one token'
        );

        require(
            _isInitialized(),
            'WrappedERC1155StewardLicenseFacet: must be initialized'
        );

        require(
            msg.sender == _wrappedTokenAddress(),
            'WrappedERC1155StewardLicenseFacet: cannot accept this token address'
        );

        require(
            id == _wrappedTokenId(),
            'WrappedERC1155StewardLicenseFacet: cannot accept this token ID'
        );

        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) external view override returns (bytes4) {
        require(
            ids.length == 1 && values.length == 1 && values[0] == 1,
            'WrappedERC1155StewardLicenseFacet: can only receive one token'
        );

        require(
            _isInitialized(),
            'WrappedERC1155StewardLicenseFacet: must be initialized'
        );

        require(
            msg.sender == _wrappedTokenAddress(),
            'WrappedERC1155StewardLicenseFacet: cannot accept this token address'
        );

        require(
            ids[0] == _wrappedTokenId(),
            'WrappedERC1155StewardLicenseFacet: cannot accept this token ID'
        );

        return this.onERC1155BatchReceived.selector;
    }
}
