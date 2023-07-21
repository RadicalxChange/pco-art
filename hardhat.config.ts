import '@nomicfoundation/hardhat-chai-matchers';
import '@solidstate/hardhat-accounts';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import 'hardhat-contract-sizer';
import 'hardhat-docgen';
import 'hardhat-gas-reporter';
import 'hardhat-spdx-license-identifier';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/types';

import * as Dotenv from 'dotenv';

Dotenv.config();

const { API_KEY_ETHERSCAN, NODE_URL_MAINNET, PKEY_MAINNET, REPORT_GAS } =
  process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    gnosis: {
      url: NODE_URL_MAINNET ?? '',
      accounts: PKEY_MAINNET ? [PKEY_MAINNET] : [],
      chainId: 100,
    },
  },

  contractSizer: {
    runOnCompile: true,
  },

  docgen: {
    clear: true,
    runOnCompile: false,
  },

  etherscan: {
    apiKey: API_KEY_ETHERSCAN ?? '',
  },

  gasReporter: {
    enabled: REPORT_GAS === 'true',
  },

  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },

  typechain: {
    alwaysGenerateOverloads: true,
  },

  abiExporter: {
    runOnCompile: true,
    clear: true,
    flat: true,
    only: ['Facet$', 'Diamond$', 'DiamondFactory$'],
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

export default config;
