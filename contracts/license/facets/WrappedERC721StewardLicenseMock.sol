// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { WrappedERC721StewardLicenseFacet } from './WrappedERC721StewardLicenseFacet.sol';

contract WrappedERC721StewardLicenseMock is WrappedERC721StewardLicenseFacet {
    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }
}
