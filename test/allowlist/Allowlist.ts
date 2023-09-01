import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('Allowlist', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let nonOwner1: SignerWithAddress;
  let admin: SignerWithAddress;

  async function getInstance() {
    const accessControlFactory = await ethers.getContractFactory(
      'AccessControlFacet',
    );
    const accessControl = await accessControlFactory.deploy();
    await accessControl.deployed();

    const facetFactory = await ethers.getContractFactory('AllowlistFacet');
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const factory = await ethers.getContractFactory('SingleCutDiamond');
    let instance = await factory.deploy([
      {
        target: facetInstance.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [
          facetInstance.interface.getSighash(
            'initializeAllowlist(bool,address[])',
          ),
          facetInstance.interface.getSighash(
            'initializeAllowlist(address,bool,address[])',
          ),
          facetInstance.interface.getSighash('isAllowed(address)'),
          facetInstance.interface.getSighash('setAllowAny(bool)'),
          facetInstance.interface.getSighash('getAllowAny()'),
          facetInstance.interface.getSighash('addToAllowlist(address)'),
          facetInstance.interface.getSighash('removeFromAllowlist(address)'),
          facetInstance.interface.getSighash('batchAddToAllowlist(address[])'),
          facetInstance.interface.getSighash(
            'batchRemoveFromAllowlist(address[])',
          ),
          facetInstance.interface.getSighash('getAllowlist()'),
          facetInstance.interface.getSighash('addToAllowlist(address,bool)'),
          facetInstance.interface.getSighash(
            'removeFromAllowlist(address,bool)',
          ),
          facetInstance.interface.getSighash(
            'batchAddToAllowlist(address[],bool)',
          ),
          facetInstance.interface.getSighash(
            'batchRemoveFromAllowlist(address[],bool)',
          ),
          facetInstance.interface.getSighash(
            'batchUpdateAllowlist(address[],address[])',
          ),
          facetInstance.interface.getSighash(
            'batchUpdateAllowlist(address[],address[],bool)',
          ),
        ],
      },
      {
        target: accessControl.address,
        initTarget: accessControl.address,
        initData: accessControl.interface.encodeFunctionData(
          'initializeAccessControl(address)',
          [admin.address],
        ),
        selectors: [
          accessControl.interface.getSighash(
            'initializeAccessControl(address)',
          ),
          accessControl.interface.getSighash('grantRole(bytes32,address)'),
          accessControl.interface.getSighash('renounceRole(bytes32)'),
          accessControl.interface.getSighash('hasRole(bytes32,address)'),
        ],
      },
    ]);
    await instance.deployed();

    instance = await ethers.getContractAt('AllowlistFacet', instance.address);

    return instance;
  }

  before(async function () {
    [owner, nonOwner, nonOwner1, admin] = await ethers.getSigners();
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
      expect(await instance.getAllowAny()).to.be.equal(true);
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
      expect(await instance.getAllowAny()).to.be.equal(true);
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
      expect(await instance.getAllowAny()).to.be.equal(false);
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

  describe('getAllowlist', function () {
    it('should return allowlist', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(bool,address[])'](false, [
        nonOwner.address,
        owner.address,
      ]);

      expect(await instance.getAllowlist()).to.be.eql([
        nonOwner.address,
        owner.address,
      ]);
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
        instance
          .connect(owner)
          ['addToAllowlist(address)'](await nonOwner.getAddress()),
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
        instance
          .connect(nonOwner)
          ['addToAllowlist(address)'](await nonOwner.getAddress()),
      ).to.be.reverted;
    });

    it('should allow owner to add with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(owner)
          ['addToAllowlist(address,bool)'](nonOwner.address, false),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(nonOwner.address)).to.be.equal(true);
      expect(await instance.getAllowAny()).to.be.equal(false);
    });

    it('should only allow owner to add with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['addToAllowlist(address,bool)'](nonOwner.address, false),
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
          ['removeFromAllowlist(address)'](await nonOwner.getAddress()),
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
          ['removeFromAllowlist(address)'](await nonOwner.getAddress()),
      ).to.be.reverted;
    });

    it('should allow owner to remove with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(owner)
          ['removeFromAllowlist(address,bool)'](nonOwner.address, false),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(nonOwner.address)).to.be.equal(false);
      expect(await instance.getAllowAny()).to.be.equal(false);
    });

    it('should only allow owner to remove with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['removeFromAllowlist(address,bool)'](nonOwner.address, false),
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
          ['batchAddToAllowlist(address[])']([
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
          ['batchAddToAllowlist(address[])']([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.be.reverted;
    });

    it('should allow owner to add with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(owner)
          ['batchAddToAllowlist(address[],bool)'](
            [nonOwner.address, nonOwner1.address],
            false,
          ),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(nonOwner.address)).to.be.equal(true);
      expect(await instance.getAllowAny()).to.be.equal(false);
    });

    it('should only allow owner to add with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['batchAddToAllowlist(address[],bool)'](
            [nonOwner.address, nonOwner1.address],
            false,
          ),
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
          ['batchRemoveFromAllowlist(address[])']([
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
          ['batchRemoveFromAllowlist(address[])']([
            await nonOwner.getAddress(),
            await nonOwner1.getAddress(),
          ]),
      ).to.be.reverted;
    });

    it('should allow owner to remove with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(owner)
          ['batchRemoveFromAllowlist(address[],bool)'](
            [nonOwner.address, nonOwner1.address],
            false,
          ),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(nonOwner.address)).to.be.equal(false);
      expect(await instance.getAllowAny()).to.be.equal(false);
    });

    it('should only allow owner to remove with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['batchRemoveFromAllowlist(address[],bool)'](
            [nonOwner.address, nonOwner1.address],
            false,
          ),
      ).to.be.reverted;
    });
  });

  describe('batchUpdateAllowlist', function () {
    it('should allow owner to update', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(owner)
          ['batchUpdateAllowlist(address[],address[])'](
            [await nonOwner.getAddress()],
            [await nonOwner1.getAddress()],
          ),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        false,
      );
      expect(
        await instance.isAllowed(await nonOwner1.getAddress()),
      ).to.be.equal(true);
    });

    it('should add if update contains address twice', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(owner)
          ['batchUpdateAllowlist(address[],address[])'](
            [nonOwner.address],
            [nonOwner.address, nonOwner1.address],
          ),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(await nonOwner.getAddress())).to.be.equal(
        true,
      );
      expect(
        await instance.isAllowed(await nonOwner1.getAddress()),
      ).to.be.equal(true);
    });

    it('should only allow owner to update', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        false,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['batchUpdateAllowlist(address[],address[])'](
            [await nonOwner.getAddress()],
            [await nonOwner1.getAddress()],
          ),
      ).to.be.reverted;
    });

    it('should allow owner to update with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(owner)
          ['batchUpdateAllowlist(address[],address[],bool)'](
            [nonOwner.address],
            [nonOwner1.address],
            false,
          ),
      ).to.not.be.reverted;
      expect(await instance.isAllowed(nonOwner.address)).to.be.equal(false);
      expect(await instance.getAllowAny()).to.be.equal(false);
    });

    it('should only allow owner to update with allow any', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [await nonOwner.getAddress()],
      );

      await expect(
        instance
          .connect(nonOwner)
          ['batchUpdateAllowlist(address[],address[],bool)'](
            [nonOwner.address],
            [nonOwner1.address],
            false,
          ),
      ).to.be.reverted;
    });
  });

  describe('hasRole', function () {
    it('should return true if address has component role', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('AllowlistFacet.COMPONENT_ROLE'),
          ),
          owner.address,
        ),
      ).to.be.true;
    });

    it('should return false if address does not have role', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        await owner.getAddress(),
        true,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('AllowlistFacet.COMPONENT_ROLE'),
          ),
          nonOwner.address,
        ),
      ).to.be.false;
    });
  });

  describe('grantRole', function () {
    it('should allow admin to grant component role', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        owner.address,
        true,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(admin)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('AllowlistFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.not.be.reverted;
    });

    it('should only allow admin to grant component role', async function () {
      const instance = await getInstance();
      await instance['initializeAllowlist(address,bool,address[])'](
        owner.address,
        true,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(owner)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('AllowlistFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.be.reverted;
    });
  });
});
