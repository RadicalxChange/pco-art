// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IBeneficiary
 */
interface IBeneficiary {
    /**
     * @notice Distribute to beneficiaries
     */
    function distribute() external payable;
}
