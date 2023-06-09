// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IOwnableBeneficiaryInternal
 */
interface IOwnableBeneficiaryInternal {
    struct Beneficiary {
        address subscriber;
        uint128 units;
    }
}
