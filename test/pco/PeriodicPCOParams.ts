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

    await instance['initializePCOParams(address,uint256,uint256,uint256)'](
      await owner.getAddress(),
      1,
      3,
      4,
    );
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

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      expect(await instance.licensePeriod()).to.be.equal(1);
    });

    it('should set feeNumerator', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      expect(await instance.feeNumerator()).to.be.equal(3);
    });

    it('should set feeDenominator', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      expect(await instance.feeDenominator()).to.be.equal(4);
    });

    it('should revert if already initialized', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      await expect(
        instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4),
      ).to.be.revertedWith('PeriodicPCOParamsFacet: already initialized');
    });
  });

  describe('initializePCOParams with owner', function () {
    it('should set licensePeriod', async function () {
      const instance = await getInstance();

      expect(await instance.licensePeriod()).to.be.equal(1);
    });

    it('should set feeNumerator', async function () {
      const instance = await getInstance();

      expect(await instance.feeNumerator()).to.be.equal(3);
    });

    it('should set feeDenominator', async function () {
      const instance = await getInstance();

      expect(await instance.feeDenominator()).to.be.equal(4);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();

      await expect(
        instance['initializePCOParams(address,uint256,uint256,uint256)'](
          await owner.getAddress(),
          1,
          3,
          4,
        ),
      ).to.be.revertedWith('PeriodicPCOParamsFacet: already initialized');
    });
  });

  describe('setPCOParameters', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();
      await expect(instance.connect(owner).setPCOParameters(111, 112, 113)).to
        .not.be.reverted;
      expect(await instance.licensePeriod()).to.be.equal(111);
      expect(await instance.feeNumerator()).to.be.equal(112);
      expect(await instance.feeDenominator()).to.be.equal(113);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setPCOParameters(111, 112, 113))
        .to.be.reverted;
    });

    it('should not allow writing if no owner', async function () {
      const factory = await ethers.getContractFactory('PeriodicPCOParamsFacet');
      const instance = await factory.deploy();
      await instance.deployed();

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      await expect(instance.connect(owner).setPCOParameters(111, 112, 113)).to
        .be.reverted;
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

      await instance['initializePCOParams(uint256,uint256,uint256)'](1, 3, 4);

      await expect(instance.connect(owner).setLicensePeriod(11)).to.be.reverted;
    });
  });

  describe('feeNumerator', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(owner).setFeeNumerator(12)).to.not.be
        .reverted;
      expect(await instance.feeNumerator()).to.be.equal(12);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setFeeNumerator(12)).to.be
        .reverted;
    });
  });

  describe('feeDenominator', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(owner).setFeeDenominator(13)).to.not.be
        .reverted;
      expect(await instance.feeDenominator()).to.be.equal(13);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();

      await expect(instance.connect(nonOwner).setFeeDenominator(13)).to.be
        .reverted;
    });
  });
});
