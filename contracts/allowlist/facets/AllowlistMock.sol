// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { IAllowlistReadable } from '../IAllowlistReadable.sol';

contract AllowlistMock is IAllowlistReadable {
    struct Layout {
        bool isAllowed;
    }

    bytes32 private constant STORAGE_SLOT =
        keccak256('pcoart.contracts.storage.MockAllowlist');

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    /**
     * @notice Check if address is allowed
     */
    function isAllowed(address) external view returns (bool) {
        return layout().isAllowed;
    }

    function setIsAllowed(bool _isAllowed) external {
        layout().isAllowed = _isAllowed;
    }
}
