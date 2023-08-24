// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @title IIDABeneficiaryInternal
 */
interface IIDABeneficiaryInternal {
    struct Beneficiary {
        address subscriber;
        uint128 units;
    }

    event TokenSet(address indexed token);
    event BeneficiaryUnitsUpdated(address indexed subscriber, uint128 units);
    event Distributed(uint256 amount);
}
