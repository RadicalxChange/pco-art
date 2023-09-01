import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployContractsAndToken } from '@superfluid-finance/ethereum-contracts/dev-scripts/deploy-contracts-and-token.js';
import { InstantDistributionAgreementV1 } from '@superfluid-finance/sdk-core';

describe('IDABeneficiary', function () {
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

    const facetFactory = await ethers.getContractFactory('IDABeneficiaryFacet');
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
            'initializeIDABeneficiary(address,(address,uint128)[])',
          ),
          facetInstance.interface.getSighash(
            'initializeIDABeneficiary(address,address,(address,uint128)[])',
          ),
          facetInstance.interface.getSighash(
            'updateBeneficiaryUnits((address,uint128)[])',
          ),
          facetInstance.interface.getSighash('distribute()'),
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
      'IDABeneficiaryFacet',
      instance.address,
    );

    return instance;
  }

  before(async function () {
    [owner, nomineeOwner, nonOwner, admin] = await ethers.getSigners();
  });

  describe('initializeIDABeneficiary', function () {
    it('should create index', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      await instance['initializeIDABeneficiary(address,(address,uint128)[])'](
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      const framework = await deployer.getFramework();
      const ida = new InstantDistributionAgreementV1(
        framework.host,
        framework.ida,
      );

      const index = await ida.getIndex({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        providerOrSigner: owner,
      });

      expect(index.exist).to.be.true;
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance['initializeIDABeneficiary(address,(address,uint128)[])'](
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance['initializeIDABeneficiary(address,(address,uint128)[])'](
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
          [],
        ),
      ).to.be.revertedWith('IDABeneficiaryFacet: already initialized');
    });
  });

  describe('initializeIDABeneficiary with owner', function () {
    it('should create index', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      const framework = await deployer.getFramework();
      const ida = new InstantDistributionAgreementV1(
        framework.host,
        framework.ida,
      );

      const index = await ida.getIndex({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        providerOrSigner: owner,
      });

      expect(index.exist).to.be.true;
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance[
          'initializeIDABeneficiary(address,address,(address,uint128)[])'
        ](
          await owner.getAddress(),
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
          [],
        ),
      ).to.be.revertedWith('IDABeneficiaryFacet: already initialized');
    });
  });

  describe('updateBeneficiaryUnits', function () {
    it('should allow owner to update', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      const framework = await deployer.getFramework();
      const ida = new InstantDistributionAgreementV1(
        framework.host,
        framework.ida,
      );

      await instance.updateBeneficiaryUnits([
        [await nomineeOwner.getAddress(), 1],
      ]);

      const sub = await ida.getSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: await nomineeOwner.getAddress(),
        providerOrSigner: owner,
      });

      expect(sub.units).to.equal('1');
    });

    it('should only allow owner to update', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance
          .connect(nomineeOwner)
          .updateBeneficiaryUnits([[await nomineeOwner.getAddress(), 1]]),
      ).to.be.reverted;
    });

    it('should not allow any updates if no owner', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance['initializeIDABeneficiary(address,(address,uint128)[])'](
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance
          .connect(owner)
          .updateBeneficiaryUnits([[await nomineeOwner.getAddress(), 1]]),
      ).to.be.reverted;
    });
  });

  describe('distribute', function () {
    it('should distribute to beneficiaries', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      const framework = await deployer.getFramework();
      const superToken = await ethers.getContractAt(
        'IERC20',
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
      );
      const ida = new InstantDistributionAgreementV1(
        framework.host,
        framework.ida,
      );

      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [
          [await nomineeOwner.getAddress(), 1],
          [await nonOwner.getAddress(), 1],
        ],
      );

      // Sub 1 approves subscription ahead of time
      const sub1ApproveOp = await ida.approveSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
      });

      const txn1Response = await sub1ApproveOp.exec(nomineeOwner);
      await txn1Response.wait();

      await instance.distribute({ value: ethers.utils.parseEther('1') });

      const sub1 = await ida.getSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: await nomineeOwner.getAddress(),
        providerOrSigner: owner,
      });
      let sub2 = await ida.getSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: await nonOwner.getAddress(),
        providerOrSigner: owner,
      });

      expect(sub1.units).to.equal('1');
      expect(sub1.pendingDistribution).to.equal('0');
      expect(await superToken.balanceOf(nomineeOwner.address)).to.equal(
        ethers.utils.parseEther('0.5'),
      );

      expect(sub2.units).to.equal('1');
      expect(sub2.pendingDistribution).to.equal(ethers.utils.parseEther('0.5'));
      expect(await superToken.balanceOf(nonOwner.address)).to.equal('0');

      // Sub 2 claims distribution
      const sub2ApproveOp = await ida.claim({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: nonOwner.address,
      });

      const txn2Response = await sub2ApproveOp.exec(nonOwner);
      await txn2Response.wait();

      sub2 = await ida.getSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: await nonOwner.getAddress(),
        providerOrSigner: owner,
      });

      expect(sub2.pendingDistribution).to.equal('0');
      expect(await superToken.balanceOf(nonOwner.address)).to.equal(
        ethers.utils.parseEther('0.5'),
      );
    });

    it('should fail if value is 0', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();

      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [
          [await nomineeOwner.getAddress(), 1],
          [await nonOwner.getAddress(), 1],
        ],
      );

      await expect(
        instance.distribute({ value: ethers.utils.parseEther('0') }),
      ).to.be.revertedWith(
        'IDABeneficiaryFacet: msg.value should be greater than 0',
      );
    });
  });

  describe('hasRole', function () {
    it('should return true if address has component role', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('IDABeneficiaryFacet.COMPONENT_ROLE'),
          ),
          owner.address,
        ),
      ).to.be.true;
    });

    it('should return false if address does not have role', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes('IDABeneficiaryFacet.COMPONENT_ROLE'),
          ),
          nonOwner.address,
        ),
      ).to.be.false;
    });
  });

  describe('grantRole', function () {
    it('should allow admin to grant component role', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
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
              ethers.utils.toUtf8Bytes('IDABeneficiaryFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.not.be.reverted;
    });

    it('should only allow admin to grant component role', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance[
        'initializeIDABeneficiary(address,address,(address,uint128)[])'
      ](
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
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
              ethers.utils.toUtf8Bytes('IDABeneficiaryFacet.COMPONENT_ROLE'),
            ),
            nonOwner.address,
          ),
      ).to.be.reverted;
    });
  });
});
