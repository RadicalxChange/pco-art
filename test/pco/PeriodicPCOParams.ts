import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('PeriodicPCOParams', function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let admin: SignerWithAddress;

  async function getInstance() {
    const accessControlFactory = await ethers.getContractFactory(
      'AccessControlFacet',
    );
    const accessControl = await accessControlFactory.deploy();
    await accessControl.deployed();

    const facetFactory = await ethers.getContractFactory(
      'PeriodicPCOParamsFacet',
    );
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
            'initializePCOParams(uint256,uint256,uint256)',
          ),
          facetInstance.interface.getSighash(
            'initializePCOParams(address,uint256,uint256,uint256)',
          ),
          facetInstance.interface.getSighash(
            'setPCOParameters(uint256,uint256,uint256)',
          ),
          facetInstance.interface.getSighash('licensePeriod()'),
          facetInstance.interface.getSighash('feeNumerator()'),
          facetInstance.interface.getSighash('feeDenominator()'),
          facetInstance.interface.getSighash('setLicensePeriod(uint256)'),
          facetInstance.interface.getSighash('setFeeNumerator(uint256)'),
          facetInstance.interface.getSighash('setFeeDenominator(uint256)'),
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

    instance = await ethers.getContractAt(
      'PeriodicPCOParamsFacet',
      instance.address,
    );

    await instance['initializePCOParams(address,uint256,uint256,uint256)'](
      await owner.getAddress(),
      1,
      3,
      4,
    );
    return instance;
  }
  before(async function () {
    [owner, nomineeOwner, nonOwner, admin] = await ethers.getSigners();
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

  describe('hasRole', function () {
    it('should return true if address has component role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('PeriodicPCOParamsFacet.COMPONENT_ROLE'),
          ),
          owner.address,
        ),
      ).to.be.true;
    });

    it('should return false if address does not have role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('PeriodicPCOParamsFacet.COMPONENT_ROLE'),
          ),
          nonOwner.address,
        ),
      ).to.be.false;
    });
  });

  describe('grantRole', function () {
    it('should allow admin to grant component role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(admin)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('PeriodicPCOParamsFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.not.be.reverted;
    });

    it('should only allow admin to grant component role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(owner)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes('PeriodicPCOParamsFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.be.reverted;
    });
  });
});
