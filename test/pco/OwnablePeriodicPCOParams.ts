import { describeBehaviorOfSafeOwnable } from '@solidstate/spec';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('OwnablePeriodicPCOParams', function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let instance;

  before(async function () {
    [owner, nomineeOwner, nonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory(
      'OwnablePeriodicPCOParamsFacet',
    );
    instance = await factory.deploy();
    await instance.deployed();

    await instance.initializePCOParams(await owner.getAddress(), 1, 2, 3, 4);
  });

  describeBehaviorOfSafeOwnable(async () => instance, {
    getOwner: async () => owner,
    getNomineeOwner: async () => nomineeOwner,
    getNonOwner: async () => nonOwner,
  });

  describe('initializePCOParams', function () {
    it('should set licensePeriod', async function () {
      expect(await instance.licensePeriod()).to.be.equal(1);
    });

    it('should set initialPeriodStartTime', async function () {
      expect(await instance.initialPeriodStartTime()).to.be.equal(2);
    });

    it('should set perSecondFeeNumerator', async function () {
      expect(await instance.perSecondFeeNumerator()).to.be.equal(3);
    });

    it('should set perSecondFeeDenominator', async function () {
      expect(await instance.perSecondFeeDenominator()).to.be.equal(4);
    });

    it('should revert if already initialized', async function () {
      expect(
        await instance.initializePCOParams(
          await owner.getAddress(),
          1,
          2,
          3,
          4,
        ),
      ).to.be.revertedWith('OwnablePeriodicPCOParams: already initialized');
    });
  });

  describe('licensePeriod', function () {
    it('should allow owner to set', async function () {
      await expect(instance.connect(owner).setLicensePeriod(11)).to.not.be
        .reverted;
      expect(await instance.licensePeriod()).to.be.equal(11);
    });

    it('should only allow owner to set', async function () {
      await expect(instance.connect(nonOwner).setLicensePeriod(11)).to.be
        .reverted;
    });
  });

  describe('perSecondFeeNumerator', function () {
    it('should allow owner to set', async function () {
      await expect(instance.connect(owner).setPerSecondFeeNumerator(12)).to.not
        .be.reverted;
      expect(await instance.perSecondFeeNumerator()).to.be.equal(12);
    });

    it('should only allow owner to set', async function () {
      await expect(instance.connect(nonOwner).setPerSecondFeeNumerator(12)).to
        .be.reverted;
    });
  });

  describe('perSecondFeeDenominator', function () {
    it('should allow owner to set', async function () {
      await expect(instance.connect(owner).setPerSecondFeeDenominator(13)).to
        .not.be.reverted;
      expect(await instance.perSecondFeeDenominator()).to.be.equal(13);
    });

    it('should only allow owner to set', async function () {
      await expect(instance.connect(nonOwner).setPerSecondFeeDenominator(13)).to
        .be.reverted;
    });
  });
});
