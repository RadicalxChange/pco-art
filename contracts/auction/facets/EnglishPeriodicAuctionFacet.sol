// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionInternal } from '../EnglishPeriodicAuctionInternal.sol';
import { IPeriodicAuction } from '../IPeriodicAuction.sol';
import { IAllowlist } from '../../allowlist/IAllowlist.sol';

/**
 * @title EnglishPeriodicAuctionFacet
 */
contract EnglishPeriodicAuctionFacet is
    IPeriodicAuction,
    EnglishPeriodicAuctionInternal
{
    /**
     * @notice Initialize auction parameters
     */
    function initializeAuction(
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds
    ) external {
        require(
            _isInitialized() == false,
            'EnglishPeriodicAuctionFacet: already initialized'
        );

        _initializeAuction(
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds
        );
    }

    /**
     * @notice Get is auction period
     */
    function isAuctionPeriod() external view returns (bool) {
        return _isAuctionPeriod();
    }

    /**
     * @notice Is token ready for transfer
     */
    function isReadyForTransfer() external view returns (bool) {
        return _isReadyForTransfer();
    }

    /**
     * @notice Place a bid
     */
    function placeBid(uint256 bidAmount) external payable {
        require(
            _isAuctionPeriod(),
            'EnglishPeriodicAuction: can only place bid in auction period'
        );
        require(
            _isReadyForTransfer() == false,
            'EnglishPeriodicAuction: auction is over and awaiting transfer'
        );
        require(
            IAllowlist(address(this)).isAllowed(msg.sender),
            'EnglishPeriodicAuction: sender is not allowed to place bid'
        );

        _placeBid(msg.sender, bidAmount, msg.value);
    }

    /**
     * @notice Withdraw bid collateral
     */
    function withdrawBid() external {
        _withdrawBid(msg.sender);
    }

    /**
     * @notice Close auction and trigger a transfer to the highest bidder
     */
    function closeAuction() external {
        require(
            _isReadyForTransfer(),
            'EnglishPeriodicAuction: auction is not over'
        );

        _closeAuction();
    }

    /**
     * @notice Get auction length
     */
    function auctionLengthSeconds() external view returns (uint256) {
        return _auctionLengthSeconds();
    }

    /**
     * @notice Get minimum bid increment
     */
    function minBidIncrement() external view returns (uint256) {
        return _minBidIncrement();
    }

    /**
     * @notice Get bid extension window length
     */
    function bidExtensionWindowLengthSeconds() external view returns (uint256) {
        return _bidExtensionWindowLengthSeconds();
    }

    /**
     *  @notice Get bid extension seconds
     */
    function bidExtensionSeconds() external view returns (uint256) {
        return _bidExtensionSeconds();
    }
}
