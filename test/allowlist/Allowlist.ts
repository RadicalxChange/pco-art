import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('Allowlist', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let nonOwner1: SignerWithAddress;

  async function getInstance() {
    const factory = await ethers.getContractFactory('AllowlistFacet');
    const instance = await factory.deploy();
    await instance.deployed();
    return instance;
  }

  before(async function () {
    [owner, nonOwner, nonOwner1] = await ethers.getSigners();
  });

  beforeEach(async function () {});

  describe('initializeAllowlist', function () {
    it('should set isAllowed', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(bool,address[])'](true, []);

      // ethers zero address
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(true);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(bool,address[])'](true, []);

      await expect(
        instance['initializeAllowlist(bool,address[])'](true, []),
      ).to.be.revertedWith('AllowlistFacet: already initialized');
    });
  });

  describe('initializeAllowlist with owner', function () {
    it('should set isAllowed', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      // ethers zero address
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(true);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance['initializeAllowlist(address,bool,address[])'](
          await owner.getAddress(),
          true,
          [],
        ),
      ).to.be.revertedWith('AllowlistFacet: already initialized');
    });
  });

  describe('setAllowAny', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(instance.connect(owner).setAllowAny(false)).to.not.be
        .reverted;
      expect(
        await instance.isAllowed(ethers.constants.AddressZero),
      ).to.be.equal(false);
    });

    it('should only allow owner to set', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(instance.connect(nonOwner).setAllowAny(false)).to.be
        .reverted;
    });

    it('should not allow setting if no owner', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(bool,address[])'](true, []);

      await expect(instance.connect(nonOwner).setAllowAny(false)).to.be
        .reverted;
    });
  });

  describe('addToAllowlist', function () {
    it('should allow owner to add', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [],
      );

      await expect(
        instance.connect(owner).addToAllowlist(await nonOwner.getAddress()),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        true,
      );
    });

    it('should only allow owner to add', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [],
      );

      await expect(
        instance.connect(nonOwner).addToAllowlist(await nonOwner.getAddress()),
      ).to.be.reverted;
    });
  });

  describe('removeFromAllowlist', function () {
    it('should allow owner to remove', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress()],
      );

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
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(nonOwner)
          .removeFromAllowlist(await nonOwner.getAddress()),
      ).to.be.reverted;
    });
  });

  describe('batchAddToAllowlist', function () {
    it('should allow owner to add', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [],
      );

      await expect(
        instance
          .connect(owner)
          .batchAddToAllowlist([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        true,
      );
      expect(
        await instance.isAllowed(await nonOwner1.getAddress()),
      ).to.be.equal(true);
    });

    it('should only allow owner to add', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [],
      );

      await expect(
        instance
          .connect(nonOwner)
          .batchAddToAllowlist([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.be.reverted;
    });
  });

  describe('batchRemoveFromAllowlist', function () {
    it('should allow owner to remove', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress(), await nonOwner1.getAddress()],
      );

      await expect(
        instance
          .connect(owner)
          .batchRemoveFromAllowlist([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        false,
      );
      expect(
        await instance.isAllowed(await nonOwner1.getAddress()),
      ).to.be.equal(false);
    });

    it('should only allow owner to remove', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress(), await nonOwner1.getAddress()],
      );

      await expect(
        instance
          .connect(nonOwner)
          .batchRemoveFromAllowlist([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.be.reverted;
    });
  });
});
