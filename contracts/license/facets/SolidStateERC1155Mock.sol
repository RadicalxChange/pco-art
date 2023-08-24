// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import { SolidStateERC1155 } from '@solidstate/contracts/token/ERC1155/SolidStateERC1155.sol';
import { IERC165 } from '@solidstate/contracts/interfaces/IERC165.sol';
import { IERC1155 } from '@solidstate/contracts/interfaces/IERC1155.sol';
import { ERC1155MetadataStorage } from '@solidstate/contracts/token/ERC1155/metadata/ERC1155MetadataStorage.sol';

contract SolidStateERC1155Mock is SolidStateERC1155 {
    constructor(string memory tokenURI) {
        _setSupportsInterface(type(IERC165).interfaceId, true);
        _setSupportsInterface(type(IERC1155).interfaceId, true);

        ERC1155MetadataStorage.layout().tokenURIs[0] = tokenURI;
    }

    function __mint(address account, uint256 id, uint256 amount) external {
        _mint(account, id, amount, '');
    }
}
