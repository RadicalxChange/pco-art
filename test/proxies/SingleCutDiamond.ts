import {
  describeBehaviorOfDiamondBase,
  describeBehaviorOfDiamondReadable,
  describeBehaviorOfERC165Base,
} from '@solidstate/spec';
import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';

describe('SingleCutDiamond', function () {
  let instance;
  let facetCuts: any[] = [];

  beforeEach(async function () {
    // Use AccessControlAllowlistFacet as a mock facet
    const facetFactory: ContractFactory = await ethers.getContractFactory(
      'AllowlistFacet',
    );
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const factory: ContractFactory = await ethers.getContractFactory(
      'SingleCutDiamond',
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

  describeBehaviorOfERC165Base(
    async () => instance,
    {
      interfaceIds: [],
    },
    [],
  );
});
