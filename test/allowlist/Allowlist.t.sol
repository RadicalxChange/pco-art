// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IDiamond } from '../../contracts/proxies/IDiamond.sol';
import { OwnableDiamond } from '../../contracts/proxies/OwnableDiamond.sol';
import { AllowlistFacet } from '../../contracts/allowlist/facets/AllowlistFacet.sol';
import { IAllowlistWritable } from '../../contracts/allowlist/IAllowlistWritable.sol';

contract TestAllowlistFacet1 is AllowlistFacet {
    constructor() {
        _grantRole(COMPONENT_ROLE, msg.sender);
        _initializeAllowlist(true, new address[](0));
    }

    function echidna_allow_any_never_changes() public view returns (bool) {
        return AllowlistFacet(address(this)).getAllowAny() == true;
    }

    function echidna_allowlist_never_changes() public view returns (bool) {
        return AllowlistFacet(address(this)).getAllowlist().length == 0;
    }
}

contract TestAllowlistFacet2 is AllowlistFacet {
    constructor() {
        _grantRole(COMPONENT_ROLE, msg.sender);

        address[] memory allowlist = new address[](1);
        allowlist[0] = address(0x10000);

        _initializeAllowlist(false, allowlist);
    }

    function echidna_allow_any_never_changes() public view returns (bool) {
        return AllowlistFacet(address(this)).getAllowAny() == false;
    }

    function echidna_allowlist_never_changes() public view returns (bool) {
        return
            AllowlistFacet(address(this)).isAllowed(address(0x10000)) == true &&
            AllowlistFacet(address(this)).isAllowed(address(0x20000)) == false;
    }
}
