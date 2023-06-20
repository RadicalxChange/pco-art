import { describeBehaviorOfProxy } from '@solidstate/spec';
import { ethers } from 'hardhat';
import { expect } from 'chai';

describe('BeaconDiamond', function () {
  let instance;

  beforeEach(async function () {
    // Use AccessControlAllowlistFacet as a mock facet
    const facetFactory = await ethers.getContractFactory('AllowlistFacet');
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const beaconFactory = await ethers.getContractFactory('SingleCutDiamond');
    const beaconInstance = await beaconFactory.deploy([
      {
        target: facetInstance.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [facetInstance.interface.getSighash('isAllowed(address)')],
      },
    ]);
    await beaconInstance.deployed();

    const factory = await ethers.getContractFactory('BeaconDiamond');
    instance = await factory.deploy(beaconInstance.address);
    await instance.deployed();
  });

  describeBehaviorOfProxy(
    async () => instance,
    {
      implementationFunction: 'isAllowed(address)',
      implementationFunctionArgs: [ethers.constants.AddressZero],
    },
    [],
  );

  describe('reverts if', function () {
    it('no selector matches data', async function () {
      let contract = new ethers.Contract(
        instance.address,
        ['function function()'],
        ethers.provider,
      );

      await expect(
        contract.callStatic['function()'](),
      ).to.be.revertedWithCustomError(
        instance,
        'BeaconDiamond__NoFacetForSignature',
      );
    });
  });
});
