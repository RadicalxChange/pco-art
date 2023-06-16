// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';

/**
 * @title IStewardLicense
 */
interface IStewardLicense is IERC721 {
    /**
     * @notice Trigger transfer of license
     */
    function triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external;
}
