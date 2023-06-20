import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('AccessControlAllowlist', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  async function getInstance() {
    const factory = await ethers.getContractFactory(
      'AccessControlAllowlistFacet',
    );
    const instance = await factory.deploy();
    await instance.deployed();
    return instance;
  }

  before(async function () {
    [owner, nonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {});

  describe('initializeAllowlist', function () {
    it('should set isAllowed', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      // ethers zero address
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(true);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      await expect(
        instance.initializeAllowlist(await owner.getAddress(), true, []),
      ).to.be.revertedWith('AccessControlAllowlistFacet: already initialized');
    });
  });

  describe('setAllowAny', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      await expect(instance.connect(owner).setAllowAny(false)).to.not.be
        .reverted;
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(false);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      await expect(instance.connect(nonOwner).setAllowAny(false)).to.be
        .reverted;
    });
  });

  describe('addToAllowlist', function () {
    it('should allow owner to add', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), false, []);

      await expect(
        instance.connect(owner).addToAllowlist(await nonOwner.getAddress()),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        true,
      );
    });

    it('should only allow owner to add', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), false, []);

      await expect(
        instance.connect(nonOwner).addToAllowlist(await nonOwner.getAddress()),
      ).to.be.reverted;
    });
  });

  describe('removeFromAllowlist', function () {
    it('should allow owner to remove', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), false, [
        await nonOwner.getAddress(),
      ]);

      await expect(
        instance
          .connect(owner)
          .removeFromAllowlist(await nonOwner.getAddress()),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        false,
      );
    });

    it('should only allow owner to remove', async function () {
      const instance = await getInstance();
      await instance.initializeAllowlist(await owner.getAddress(), false, [
        await nonOwner.getAddress(),
      ]);

      await expect(
        instance
          .connect(nonOwner)
          .removeFromAllowlist(await nonOwner.getAddress()),
      ).to.be.reverted;
    });
  });
});
