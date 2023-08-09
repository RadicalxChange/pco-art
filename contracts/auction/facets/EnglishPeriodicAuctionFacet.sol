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
        address _initialBidder,
        uint256 _initialPeriodStartTime,
        uint256 _initialPeriodStartTimeOffset,
        uint256 _startingBid,
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds
    ) external {
        require(
            _isInitialized() == false,
            'EnglishPeriodicAuctionFacet: already initialized'
        );

        _setSupportsInterface(type(IPeriodicAuctionReadable).interfaceId, true);
        _initializeAuction(
            _repossessor,
            _initialBidder,
            _initialPeriodStartTime,
            _initialPeriodStartTimeOffset,
            _startingBid,
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds
        );
    }

    /**
     * @notice Initialize auction parameters with owner
     */
    function initializeAuction(
        address _owner,
        address _repossessor,
        address _initialBidder,
        uint256 _initialPeriodStartTime,
        uint256 _initialPeriodStartTimeOffset,
        uint256 _startingBid,
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds
    ) external {
        require(
            _isInitialized() == false,
            'EnglishPeriodicAuctionFacet: already initialized'
        );

        _setSupportsInterface(type(IPeriodicAuctionReadable).interfaceId, true);
        _setSupportsInterface(type(IPeriodicAuctionWritable).interfaceId, true);
        _grantRole(COMPONENT_ROLE, _owner);
        _setRoleAdmin(COMPONENT_ROLE, COMPONENT_ROLE);
        _initializeAuction(
            _repossessor,
            _initialBidder,
            _initialPeriodStartTime,
            _initialPeriodStartTimeOffset,
            _startingBid,
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds
        );
    }

    /**
     * @notice Set auction parameters
     */
    function setAuctionParameters(
        address _repossessor,
        uint256 _auctionLengthSeconds,
        uint256 _minBidIncrement,
        uint256 _bidExtensionWindowLengthSeconds,
        uint256 _bidExtensionSeconds,
        uint256 _startingBid
    ) external onlyRole(COMPONENT_ROLE) {
        _setAuctionParameters(
            _repossessor,
            _auctionLengthSeconds,
            _minBidIncrement,
            _bidExtensionWindowLengthSeconds,
            _bidExtensionSeconds,
            _startingBid
        );
    }

    /**
     * @notice Get starting bid
     */
    function startingBid() external view returns (uint256) {
        return _startingBid();
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
     * @notice Get initial bidder
     */
    function initialBidder() external view returns (address) {
        return _initialBidder();
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
     * @notice Cancel bid for current round
     */
    function cancelBid(uint256 tokenId, uint256 round) external {
        _cancelBid(tokenId, round, msg.sender);
    }

    /**
     * @notice Withdraw collateral
     */
    function withdrawCollateral() external {
        _withdrawCollateral(msg.sender);
    }

    /**
     * @notice Cancel bid for current round and withdraw collateral
     */
    function cancelBidAndWithdrawCollateral(
        uint256 tokenId,
        uint256 round
    ) external {
        _cancelBid(tokenId, round, msg.sender);
        _withdrawCollateral(msg.sender);
    }

    /**
     * @notice Get available collateral
     */
    function availableCollateral(
        address bidder
    ) external view returns (uint256) {
        return _availableCollateral(bidder);
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
     * @notice Set starting bid
     */
    function setStartingBid(
        uint256 _startingBid
    ) external onlyRole(COMPONENT_ROLE) {
        _setStartingBid(_startingBid);
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
        return _highestBid(tokenId, _currentAuctionRound(tokenId));
    }

    /**
     * @notice Get highest outstanding bid for a particular round
     */
    function highestBid(
        uint256 tokenId,
        uint256 round
    ) external view returns (Bid memory) {
        return _highestBid(tokenId, round);
    }

    /**
     * @notice Get bid for address
     */
    function bidOf(
        uint256 tokenId,
        address bidder
    ) external view returns (Bid memory) {
        return _bidOf(tokenId, _currentAuctionRound(tokenId), bidder);
    }

    /**
     * @notice Get bid for address for particular round
     */
    function bidOf(
        uint256 tokenId,
        uint256 round,
        address bidder
    ) external view returns (Bid memory) {
        return _bidOf(tokenId, round, bidder);
    }

    /**
     * @notice Get current auction round
     */
    function currentAuctionRound(
        uint256 tokenId
    ) external view returns (uint256) {
        return _currentAuctionRound(tokenId);
    }
}
