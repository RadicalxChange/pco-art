// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EnglishPeriodicAuctionInternal } from '../EnglishPeriodicAuctionInternal.sol';
import { IPeriodicAuctionReadable } from '../IPeriodicAuctionReadable.sol';
import { IPeriodicAuctionWritable } from '../IPeriodicAuctionWritable.sol';
import { IAllowlistReadable } from '../../allowlist/IAllowlistReadable.sol';
import { ERC165BaseInternal } from '@solidstate/contracts/introspection/ERC165/base/ERC165BaseInternal.sol';
import { AccessControlInternal } from '@solidstate/contracts/access/access_control/AccessControlInternal.sol';

/**
 * @title EnglishPeriodicAuctionFacet
 */
contract EnglishPeriodicAuctionFacet is
    IPeriodicAuctionReadable,
    IPeriodicAuctionWritable,
    EnglishPeriodicAuctionInternal,
    AccessControlInternal,
    ERC165BaseInternal
{
    // Component role
    bytes32 internal constant COMPONENT_ROLE =
        keccak256('EnglishPeriodicAuctionFacet.COMPONENT_ROLE');

    /**
     * @notice Initialize auction parameters
     */
    function initializeAuction(
        address _repossessor,
        address initialBidder,
        uint256 _initialPeriodStartTime,
        uint256 startingBid,
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds,
        uint256 _maxTokenCount
    ) external {
        require(
            _isInitialized() == false,
            'EnglishPeriodicAuctionFacet: already initialized'
        );

        _setSupportsInterface(type(IPeriodicAuctionReadable).interfaceId, true);
        _initializeAuction(
            _repossessor,
            initialBidder,
            _initialPeriodStartTime,
            startingBid,
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds,
            _maxTokenCount
        );
    }

    /**
     * @notice Initialize auction parameters with owner
     */
    function initializeAuction(
        address _owner,
        address _repossessor,
        address initialBidder,
        uint256 _initialPeriodStartTime,
        uint256 startingBid,
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds,
        uint256 _maxTokenCount
    ) external {
        require(
            _isInitialized() == false,
            'EnglishPeriodicAuctionFacet: already initialized'
        );

        _setSupportsInterface(type(IPeriodicAuctionReadable).interfaceId, true);
        _setSupportsInterface(type(IPeriodicAuctionWritable).interfaceId, true);
        _grantRole(COMPONENT_ROLE, _owner);
        _initializeAuction(
            _repossessor,
            initialBidder,
            _initialPeriodStartTime,
            startingBid,
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds,
            _maxTokenCount
        );
    }

    /**
     * @notice Get max token count
     */
    function maxTokenCount() external view returns (uint256) {
        return _maxTokenCount();
    }

    /**
     * @notice Get is auction period
     */
    function isAuctionPeriod(uint256 tokenId) external view returns (bool) {
        return _isAuctionPeriod(tokenId);
    }

    /**
     * @notice Get initial period start time
     */
    function initialPeriodStartTime() external view returns (uint256) {
        return _initialPeriodStartTime();
    }

    /**
     * @notice Is token ready for transfer
     */
    function isReadyForTransfer(uint256 tokenId) external view returns (bool) {
        return _isReadyForTransfer(tokenId);
    }

    /**
     * @notice Place a bid
     */
    function placeBid(uint256 tokenId, uint256 bidAmount) external payable {
        require(
            _isAuctionPeriod(tokenId),
            'EnglishPeriodicAuction: can only place bid in auction period'
        );
        require(
            _isReadyForTransfer(tokenId) == false,
            'EnglishPeriodicAuction: auction is over and awaiting transfer'
        );
        require(
            IAllowlistReadable(address(this)).isAllowed(msg.sender),
            'EnglishPeriodicAuction: sender is not allowed to place bid'
        );

        _placeBid(tokenId, msg.sender, bidAmount, msg.value);
    }

    /**
     * @notice Withdraw bid collateral
     */
    function withdrawBid(uint256 tokenId) external {
        _withdrawBid(tokenId, msg.sender);
    }

    /**
     * @notice Close auction and trigger a transfer to the highest bidder
     */
    function closeAuction(uint256 tokenId) external {
        require(
            _isReadyForTransfer(tokenId),
            'EnglishPeriodicAuction: auction is not over'
        );

        _closeAuction(tokenId);
    }

    /**
     * @notice Initial bidder can mint token if it doesn't exist
     */
    function mintToken(address to, uint256 tokenId) external {
        require(
            msg.sender == _initialBidder(),
            'EnglishPeriodicAuction: only initial bidder can mint token'
        );
        require(
            block.timestamp < _initialPeriodStartTime(),
            'EnglishPeriodicAuction: cannot mint after initial period start time'
        );

        _mintToken(to, tokenId);
    }

    /**
     * @notice Calculate fee from bid
     */
    function calculateFeeFromBid(
        uint256 bidAmount
    ) external view returns (uint256) {
        return _calculateFeeFromBid(bidAmount);
    }

    /**
     * @notice Get auction start time
     */
    function auctionStartTime(uint256 tokenId) external view returns (uint256) {
        return _auctionStartTime(tokenId);
    }

    /**
     * @notice Get auction end time
     */
    function auctionEndTime(uint256 tokenId) external view returns (uint256) {
        return _auctionEndTime(tokenId);
    }

    /**
     * @notice Get repossessor
     */
    function repossessor() external view returns (address) {
        return _repossessor();
    }

    /**
     * @notice Set repossessor
     */
    function setRepossessor(
        address _repossessor
    ) external onlyRole(COMPONENT_ROLE) {
        _setRepossessor(_repossessor);
    }

    /**
     * @notice Get auction length
     */
    function auctionLengthSeconds() external view returns (uint256) {
        return _auctionLengthSeconds();
    }

    /**
     * @notice Set auction length
     */
    function setAuctionLengthSeconds(
        uint256 _auctionLengthSeconds
    ) external onlyRole(COMPONENT_ROLE) {
        _setAuctionLengthSeconds(_auctionLengthSeconds);
    }

    /**
     * @notice Get minimum bid increment
     */
    function minBidIncrement() external view returns (uint256) {
        return _minBidIncrement();
    }

    /**
     * @notice Set minimum bid increment
     */
    function setMinBidIncrement(
        uint256 _minBidIncrement
    ) external onlyRole(COMPONENT_ROLE) {
        _setMinBidIncrement(_minBidIncrement);
    }

    /**
     * @notice Get bid extension window length
     */
    function bidExtensionWindowLengthSeconds() external view returns (uint256) {
        return _bidExtensionWindowLengthSeconds();
    }

    /**
     * @notice Set bid extension window length
     */
    function setBidExtensionWindowLengthSeconds(
        uint256 _bidExtensionWindowLengthSeconds
    ) external onlyRole(COMPONENT_ROLE) {
        _setBidExtensionWindowLengthSeconds(_bidExtensionWindowLengthSeconds);
    }

    /**
     *  @notice Get bid extension seconds
     */
    function bidExtensionSeconds() external view returns (uint256) {
        return _bidExtensionSeconds();
    }

    /**
     *  @notice Set bid extension seconds
     */
    function setBidExtensionSeconds(
        uint256 _bidExtensionSeconds
    ) external onlyRole(COMPONENT_ROLE) {
        _setBidExtensionSeconds(_bidExtensionSeconds);
    }

    /**
     * @notice Get highest outstanding bid
     */
    function highestBid(uint256 tokenId) external view returns (Bid memory) {
        return _highestBid(tokenId);
    }

    /**
     * @notice Get current bid
     */
    function currentBid(uint256 tokenId) external view returns (Bid memory) {
        return _currentBid(tokenId);
    }

    /**
     * @notice Get bid for address
     */
    function bidOf(
        uint256 tokenId,
        address bidder
    ) external view returns (Bid memory) {
        return _bidOf(tokenId, bidder);
    }
}
