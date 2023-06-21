// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { StewardLicenseInternal } from './StewardLicenseInternal.sol';
import { IStewardLicense } from './IStewardLicense.sol';

/**
 * @title StewardLicenseBase
 */
abstract contract StewardLicenseBase is
    StewardLicenseInternal,
    IStewardLicense
{
    /**
     * @notice Trigger transfer of license
     */
    function triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external {
        require(
            msg.sender == address(this),
            'NativeStewardLicense: Trigger transfer can only be called from another facet'
        );

        // Safe transfer is not needed. If receiver does not implement ERC721Receiver, next auction can still happen. This prevents a failed transfer from locking up license
        _transfer(from, to, tokenId);
    }
}
