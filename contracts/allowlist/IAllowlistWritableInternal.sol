// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IAllowlistWritableInternal
 */
interface IAllowlistWritableInternal {
    event Allowlisted(address indexed _address);
    event BatchAllowlisted(address[] _addresses);

    event Unallowlisted(address indexed _address);
    event BatchUnallowlisted(address[] _addresses);

    event AllowAnyUpdated(bool indexed _allowAny);
}
