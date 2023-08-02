// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { StewardLicenseInternal } from './StewardLicenseInternal.sol';
import { IERC721 } from '@solidstate/contracts/interfaces/IERC721.sol';
import { IPeriodicAuctionReadable } from '../auction/IPeriodicAuctionReadable.sol';

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

        _triggerTransfer(from, to, tokenId);
    }

    /**
     * @notice Initial bidder can mint token if it doesn't exist
     */
    function mintToken(address to, uint256 tokenId) external {
        require(
            msg.sender ==
                IPeriodicAuctionReadable(address(this)).initialBidder(),
            'StewardLicenseFacet: only initial bidder can mint token'
        );
        require(
            block.timestamp <
                IPeriodicAuctionReadable(address(this))
                    .initialPeriodStartTime(),
            'StewardLicenseFacet: cannot mint after initial period start time'
        );
        require(
            _exists(tokenId) == false,
            'StewardLicenseFacet: Token already exists'
        );

        _triggerTransfer(address(0), to, tokenId);
    }

    /**
     * @notice Add token to collection
     */
    function addTokenToCollection(
        address to,
        string memory tokenURI
    ) external onlyRole(ADD_TOKEN_TO_COLLECTION_ROLE) {
        _addTokenToCollection(to, tokenURI);
    }

    /**
     * @notice Add tokens to collection with to
     */
    function addTokensToCollection(
        address[] memory to,
        string[] memory tokenURIs
    ) external onlyRole(ADD_TOKEN_TO_COLLECTION_ROLE) {
        require(
            to.length == tokenURIs.length,
            'StewardLicenseFacet: to and tokenURIs length mismatch'
        );

        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _addTokenToCollection(to[i], tokenURIs[i]);
        }
    }

    /**
     * @notice Add tokens to collection
     */
    function addTokensToCollection(
        string[] memory tokenURIs,
        bool shouldMint
    ) external onlyRole(ADD_TOKEN_TO_COLLECTION_ROLE) {
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            address to;
            if (shouldMint) {
                to = _initialSteward();
            } else {
                to = address(0);
            }
            _addTokenToCollection(to, tokenURIs[i]);
        }
    }

    /**
     * @notice Add tokens to collection with baseURI
     */
    function addTokensWithBaseURIToCollection(
        uint32 amount,
        string memory baseURI,
        bool shouldMint
    ) external onlyRole(ADD_TOKEN_TO_COLLECTION_ROLE) {
        for (uint32 i = 0; i < amount; i++) {
            _addTokenWithBaseURIToCollection(baseURI, shouldMint);
        }
    }

    /**
     * @notice Get max token count
     */
    function maxTokenCount() external view returns (uint256) {
        return _maxTokenCount();
    }

    /**
     * @notice Check if token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }
}
