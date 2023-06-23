import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('PeriodicPCOParams', function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  async function getInstance() {
    const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
    const instance = await factory.deploy();
    await instance.deployed();

    await instance[
      'initializePCOParams(address,uint256,uint256,uint256,uint256)'
    ](await owner.getAddress(), 1, 2, 3, 4);
    return instance;
  }
  before(async function () {
    [owner, nomineeOwner, nonOwner] = await ethers.getSigners();
  });

  describe('initializePCOParams', function () {
    it('should set licensePeriod', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      expect(await instance.licensePeriod()).to.be.equal(1);
    });

    it('should set initialPeriodStartTime', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      expect(await instance.initialPeriodStartTime()).to.be.equal(2);
    });

    it('should set perSecondFeeNumerator', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      expect(await instance.perSecondFeeNumerator()).to.be.equal(3);
    });

    it('should set perSecondFeeDenominator', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      expect(await instance.perSecondFeeDenominator()).to.be.equal(4);
    });

    it('should revert if already initialized', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      await expect(
        instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
          1,
          2,
          3,
          4,
        ),
      ).to.be.revertedWith('PeriodicPCOParamsFacet: already initialized');
    });
  });

  describe('initializePCOParams with owner', function () {
    it('should set licensePeriod', async function () {
      const instance = await getInstance();

      expect(await instance.licensePeriod()).to.be.equal(1);
    });

    it('should set initialPeriodStartTime', async function () {
      const instance = await getInstance();

      expect(await instance.initialPeriodStartTime()).to.be.equal(2);
    });

    it('should set perSecondFeeNumerator', async function () {
      const instance = await getInstance();

      expect(await instance.perSecondFeeNumerator()).to.be.equal(3);
    });

    it('should set perSecondFeeDenominator', async function () {
      const instance = await getInstance();

      expect(await instance.perSecondFeeDenominator()).to.be.equal(4);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();

      await expect(
        instance[
          'initializePCOParams(address,uint256,uint256,uint256,uint256)'
        ](await owner.getAddress(), 1, 2, 3, 4),
      ).to.be.revertedWith('PeriodicPCOParamsFacet: already initialized');
    });
  });

  describe('licensePeriod', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();
      await expect(instance.connect(owner).setLicensePeriod(11)).to.not.be
        .reverted;
      expect(await instance.licensePeriod()).to.be.equal(11);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setLicensePeriod(11)).to.be
        .reverted;
    });

    it('should not allow writing if no owner', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256,uint256)'](
        1,
        2,
        3,
        4,
      );

      await expect(instance.connect(owner).setLicensePeriod(11)).to.be.reverted;
    });
  });

  describe('perSecondFeeNumerator', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(owner).setPerSecondFeeNumerator(12)).to.not
        .be.reverted;
      expect(await instance.perSecondFeeNumerator()).to.be.equal(12);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setPerSecondFeeNumerator(12)).to
        .be.reverted;
    });
  });

  describe('perSecondFeeDenominator', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(owner).setPerSecondFeeDenominator(13)).to
        .not.be.reverted;
      expect(await instance.perSecondFeeDenominator()).to.be.equal(13);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setPerSecondFeeDenominator(13)).to
        .be.reverted;
    });
  });
});