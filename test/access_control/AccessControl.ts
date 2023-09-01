import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describe('AccessControl', function () {
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;

  async function getInstance() {
    const accessControlFactory = await ethers.getContractFactory(
      'AccessControlFacet',
    );
    const accessControl = await accessControlFactory.deploy();
    await accessControl.deployed();

    await accessControl.initializeAccessControl(admin.address);

    return accessControl;
  }

  before(async function () {
    [owner, admin] = await ethers.getSigners();
  });

  beforeEach(async function () {});

  describe('initializeAccessControl', function () {
    it('should not allow access control initialization if admin role exists', async function () {
      const instance = await getInstance();

      await expect(instance.initializeAccessControl(owner.address)).to.be
        .reverted;
    });
  });
});
