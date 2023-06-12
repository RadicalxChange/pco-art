// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { NativeStewardLicenseFacet } from './NativeStewardLicenseFacet.sol';

contract NativeStewardLicenseMock is NativeStewardLicenseFacet {
    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function isAuctionPeriod() external pure returns (bool) {
        return false;
    }
}
