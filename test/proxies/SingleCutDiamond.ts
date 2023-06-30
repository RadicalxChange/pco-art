import {
  describeBehaviorOfDiamondBase,
  describeBehaviorOfDiamondReadable,
  describeBehaviorOfERC165Base,
} from '@solidstate/spec';
import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';
import { expect } from 'chai';

describe('SingleCutDiamond', function () {
  let instance;
  let facetInstance;
  let facetCuts: any[] = [];

  beforeEach(async function () {
    const diamondFactory = await ethers.getContractFactory(
      'SingleCutDiamondFactory',
    );
    const diamondFactoryInstance = await diamondFactory.deploy();
    await diamondFactoryInstance.deployed();

    // Use AccessControlAllowlistFacet as a mock facet
    const facetFactory: ContractFactory = await ethers.getContractFactory(
      'AllowlistFacet',
    );
    facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const res = await diamondFactoryInstance.createDiamond([
      {
        target: facetInstance.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [facetInstance.interface.getSighash('isAllowed(address)')],
      },
    ]);
    const receipt = await res.wait();
    const singleCutDiamondAddress =
      receipt.events[receipt.events.length - 1].args.diamondAddress;

    instance = await ethers.getContractAt(
      'SingleCutDiamond',
      singleCutDiamondAddress,
    );

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

  describeBehaviorOfERC165Base(
    async () => instance,
    {
      interfaceIds: [],
    },
    [],
  );
});
