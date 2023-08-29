// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { EnumerableSet } from '@solidstate/contracts/data/EnumerableSet.sol';
import { AllowlistStorage } from './AllowlistStorage.sol';
import { IAllowlistWritableInternal } from './IAllowlistWritableInternal.sol';

/**
 * @title AllowlistWritableInternal
 */
abstract contract AllowlistWritableInternal is IAllowlistWritableInternal {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Initialize allowlist
     */
    function _initializeAllowlist(
        bool _allowAny,
        address[] memory _addresses
    ) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.isInitialized = true;

        _setAllowAny(_allowAny);

        for (uint256 i = 0; i < _addresses.length; i++) {
            //slither-disable-next-line unused-return
            l.allowlist.add(_addresses[i]);
        }
    }

    /**
     * @notice Check if initialized
     */
    function _isInitialized() internal view returns (bool) {
        return AllowlistStorage.layout().isInitialized;
    }

    /**
     * @notice Set allow any
     */
    function _setAllowAny(bool _allowAny) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        l.allowAny = _allowAny;

        emit AllowAnyUpdated(_allowAny);
    }

    /**
     * @notice Add to allowlist
     */
    function _addToAllowlist(address _address) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        //slither-disable-next-line unused-return
        l.allowlist.add(_address);

        emit Allowlisted(_address);
    }

    /**
     * @notice Remove from allowlist
     */
    function _removeFromAllowlist(address _address) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        //slither-disable-next-line unused-return
        l.allowlist.remove(_address);

        emit Unallowlisted(_address);
    }

    /**
     * @notice Batch add to allowlist
     */
    function _batchAddToAllowlist(address[] memory _addresses) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        for (uint256 i = 0; i < _addresses.length; i++) {
            //slither-disable-next-line unused-return
            l.allowlist.add(_addresses[i]);
        }

        emit BatchAllowlisted(_addresses);
    }

    /**
     * @notice Batch remove from allowlist
     */
    function _batchRemoveFromAllowlist(address[] memory _addresses) internal {
        AllowlistStorage.Layout storage l = AllowlistStorage.layout();

        for (uint256 i = 0; i < _addresses.length; i++) {
            //slither-disable-next-line unused-return
            l.allowlist.remove(_addresses[i]);
        }

        emit BatchUnallowlisted(_addresses);
    }
}
