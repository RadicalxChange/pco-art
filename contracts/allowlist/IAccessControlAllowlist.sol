// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IAllowlist } from './IAllowlist.sol';

/**
 * @title IAccessControlAllowlist
 */
interface IAccessControlAllowlist is IAllowlist {
    /**
     * @notice Set allow any
     */
    function setAllowAny(bool _allowAny) external;

    /**
     * @notice Add to allowlist
     */
    function addToAllowlist(address _address) external;

    /**
     * @notice Remove from allowlist
     */
    function removeFromAllowlist(address _address) external;
}
