// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { NativeStewardLicenseFacet } from './NativeStewardLicenseFacet.sol';
import { IStewardLicense } from '../IStewardLicense.sol';

contract NativeStewardLicenseMock is NativeStewardLicenseFacet {
    function mint(address account, uint256 tokenId) external {
        _mint(account, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }

    function testTriggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external {
        IStewardLicense(address(this)).triggerTransfer(from, to, tokenId);
    }
}
