import { describeBehaviorOfSafeOwnable } from '@solidstate/spec';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('OwnableAllowlist', function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let instance;

  before(async function () {
    [owner, nomineeOwner, nonOwner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory('OwnableAllowlistFacet');
    instance = await factory.deploy();
    await instance.deployed();
  });

  describeBehaviorOfSafeOwnable(
    async () => {
      const factory = await ethers.getContractFactory('OwnableAllowlistFacet');
      const instance = await factory.deploy();
      await instance.deployed();
      await instance.initializeAllowlist(await owner.getAddress(), true, []);
      return instance;
    },
    {
      getOwner: async () => owner,
      getNomineeOwner: async () => nomineeOwner,
      getNonOwner: async () => nonOwner,
    },
  );

  describe('initializeAllowlist', function () {
    it('should set isAllowed', async function () {
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      // ethers zero address
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(true);
    });

    it('should revert if already initialized', async function () {
      expect(
        await instance.initializeAllowlist(await owner.getAddress(), true, []),
      ).to.be.revertedWith('OwnableAllowlistFacet: already initialized');
    });
  });

  describe('setAllowAny', function () {
    it('should allow owner to set', async function () {
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      await expect(instance.connect(owner).setAllowAny(false)).to.not.be
        .reverted;
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(false);
    });

    it('should only allow owner to set', async function () {
      await instance.initializeAllowlist(await owner.getAddress(), true, []);

      await expect(instance.connect(nonOwner).setAllowAny(false)).to.be
        .reverted;
    });
  });

  describe('addToAllowlist', function () {
    it('should allow owner to add', async function () {
      await instance.initializeAllowlist(await owner.getAddress(), false, []);

      await expect(
        instance.connect(owner).addToAllowlist(await nonOwner.getAddress()),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        true,
      );
    });

    it('should only allow owner to add', async function () {
      await instance.initializeAllowlist(await owner.getAddress(), false, []);

      await expect(
        instance.connect(nonOwner).addToAllowlist(await nonOwner.getAddress()),
      ).to.be.reverted;
    });
  });

  describe('removeFromAllowlist', function () {
    it('should allow owner to remove', async function () {
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
