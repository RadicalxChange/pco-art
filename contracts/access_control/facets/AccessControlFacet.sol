// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { AccessControl } from '@solidstate/contracts/access/access_control/AccessControl.sol';

/**
 * @title AccessControlFacet
 */
contract AccessControlFacet is AccessControl {
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @notice Initialize access control with admin
     */
    function initializeAccessControl(address admin) external {
        require(
            _getRoleMemberCount(DEFAULT_ADMIN_ROLE) == 0,
            'AccessControlFacet: admin role already granted'
        );

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }
}
