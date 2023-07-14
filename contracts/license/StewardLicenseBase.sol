// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { StewardLicenseInternal } from './StewardLicenseInternal.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';

/**
 * @title StewardLicenseBase
 */
abstract contract StewardLicenseBase is IERC721, StewardLicenseInternal {
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

        if (_ownerOf(tokenId) == address(0)) {
            // Mint token
            _mint(to, tokenId);
        } else {
            // Safe transfer is not needed. If receiver does not implement ERC721Receiver, next auction can still happen. This prevents a failed transfer from locking up license
            _transfer(from, to, tokenId);
        }
    }
}
