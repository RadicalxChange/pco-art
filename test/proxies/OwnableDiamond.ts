import {
  describeBehaviorOfDiamondBase,
  describeBehaviorOfDiamondReadable,
  describeBehaviorOfDiamondWritable,
  describeBehaviorOfERC165Base,
  describeBehaviorOfSafeOwnable,
} from '@solidstate/spec';
import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('OwnableDiamond', function () {
  let instance;
  let facetInstance;
  let facetCuts: any[] = [];
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;

  before(async function () {
    [owner, nonOwner, nomineeOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Use AccessControlAllowlistFacet as a mock facet
    const facetFactory: ContractFactory = await ethers.getContractFactory(
      'AllowlistFacet',
    );
    facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const factory: ContractFactory = await ethers.getContractFactory(
      'OwnableDiamond',
    );
    instance = await factory.deploy([
      {
        target: facetInstance.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [facetInstance.interface.getSighash('isAllowed(address)')],
      },
    ]);
    await instance.deployed();

    const facets = await instance.callStatic['facets()']();

    facetCuts[0] = {
      target: instance.address,
      action: 0,
      selectors: facets[0].selectors,
    };
    facetCuts[1] = {
      target: facetInstance.address,
      action: 0,
      selectors: [facetInstance.interface.getSighash('isAllowed(address)')],
    };
  });

  describeBehaviorOfDiamondBase(
    async () => instance,
    {
      facetFunction: 'isAllowed(address)',
      facetFunctionArgs: [ethers.constants.AddressZero],
    },
    [],
  );

  describeBehaviorOfDiamondReadable(
    async () => instance,
    {
      facetCuts,
    },
    [],
  );

  describeBehaviorOfDiamondWritable(
    async () => instance,
    {
      getOwner: async () => owner,
      getNonOwner: async () => nonOwner,
    },
    [],
  );

  describeBehaviorOfERC165Base(
    async () => instance,
    {
      interfaceIds: [],
    },
    [],
  );

  describeBehaviorOfSafeOwnable(
    async () => instance,
    {
      getOwner: async () => owner,
      getNonOwner: async () => nonOwner,
      getNomineeOwner: async () => nomineeOwner,
    },
    [],
  );
});
