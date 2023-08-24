// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { WrappedERC1155StewardLicenseFacet } from './WrappedERC1155StewardLicenseFacet.sol';

contract WrappedERC1155StewardLicenseMock is WrappedERC1155StewardLicenseFacet {
    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }
}
