// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ERC165Base } from '@solidstate/contracts/introspection/ERC165/base/ERC165Base.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC1155 } from '@solidstate/contracts/interfaces/IERC1155.sol';
import { IERC1155Metadata } from '@solidstate/contracts/token/ERC1155/metadata/IERC1155Metadata.sol';
import { DiamondBaseStorage } from '@solidstate/contracts/proxy/diamond/base/DiamondBaseStorage.sol';
import { StewardLicenseInternal } from '../StewardLicenseInternal.sol';
import { IStewardLicense } from '../IStewardLicense.sol';
import { StewardLicenseBase } from '../StewardLicenseBase.sol';
import { IERC1155Receiver } from '@solidstate/contracts/interfaces/IERC1155Receiver.sol';

/**
 * @title WrappedERC1155StewardLicenseFacet
 * @dev ERC-721 token license for Steward that wraps existing ERC-1155. Transfers are disabled during an auction.
 */
contract WrappedERC1155StewardLicenseFacet is
    StewardLicenseInternal,
    IStewardLicense,
    StewardLicenseBase,
    IERC1155Receiver
{
    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        require(
            _isInitialized() == false,
            'WrappedERC1155StewardLicenseFacet: already initialized'
        );

        require(
            value == 1,
            'WrappedERC1155StewardLicenseFacet: can only receive one token'
        );

        (address steward, string memory name, string memory symbol) = abi
            .decode(data, (address, string, string));

        _initializeStewardLicense(
            steward,
            name,
            symbol,
            IERC1155Metadata(msg.sender).uri(id)
        );

        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        require(
            _isInitialized() == false,
            'WrappedERC1155StewardLicenseFacet: already initialized'
        );

        require(
            ids.length == 1 && values.length == 1 && values[0] == 1,
            'WrappedERC1155StewardLicenseFacet: can only receive one token'
        );

        (address steward, string memory name, string memory symbol) = abi
            .decode(data, (address, string, string));

        _initializeStewardLicense(
            steward,
            name,
            symbol,
            IERC1155Metadata(msg.sender).uri(ids[0])
        );

        return this.onERC1155BatchReceived.selector;
    }
}
