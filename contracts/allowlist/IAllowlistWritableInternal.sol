// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IAllowlistWritableInternal
 */
interface IAllowlistWritableInternal {
    event Allowlisted(address indexed _address);

    event Unallowlisted(address indexed _address);

    event AllowAnyUpdated(bool indexed _allowAny);
}
