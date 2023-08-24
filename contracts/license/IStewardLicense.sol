// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { IERC721Metadata } from '@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol';

/**
 * @title IStewardLicense
 */
interface IStewardLicense is IERC721, IERC721Metadata {
    /**
     * @notice Trigger transfer of license
     */
    function triggerTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * @notice Check if token exists
     */
    function exists(uint256 tokenId) external view returns (bool);

    /**
     * @notice Get max token count
     */
    function maxTokenCount() external view returns (uint256);
}
