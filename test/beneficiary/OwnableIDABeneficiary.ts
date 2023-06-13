import { describeBehaviorOfSafeOwnable } from '@solidstate/spec';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployContractsAndToken } from '@superfluid-finance/ethereum-contracts/dev-scripts/deploy-contracts-and-token.js';

import { InstantDistributionAgreementV1 } from '@superfluid-finance/sdk-core';
describe('OwnableIDABeneficiary', function () {
  let owner: SignerWithAddress;
  let nomineeOwner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  async function getInstance() {
    const factory = await ethers.getContractFactory(
      'OwnableIDABeneficiaryFacet',
    );
    const instance = await factory.deploy();
    await instance.deployed();

    return instance;
  }

  before(async function () {
    [owner, nomineeOwner, nonOwner] = await ethers.getSigners();
  });

  describeBehaviorOfSafeOwnable(
    async () => {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();
      await instance.initializeIDABeneficiary(
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );
      return instance;
    },
    {
      getOwner: async () => owner,
      getNomineeOwner: async () => nomineeOwner,
      getNonOwner: async () => nonOwner,
    },
  );

  describe('initializeIDABeneficiary', function () {
    it('should create index', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      await instance.initializeIDABeneficiary(
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
      await instance.initializeIDABeneficiary(
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance.initializeIDABeneficiary(
          await owner.getAddress(),
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
          [],
        ),
      ).to.be.revertedWith('OwnableIDABeneficiaryFacet: already initialized');
    });
  });

  describe('updateBeneficiaryUnits', function () {
    it('should allow owner to update', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      await instance.initializeIDABeneficiary(
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
      await instance.initializeIDABeneficiary(
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [],
      );

      await expect(
        instance
          .connect(nomineeOwner)
          .updateBeneficiaryUnits([[await nomineeOwner.getAddress(), 1]]),
      ).to.be.revertedWithCustomError(instance, 'Ownable__NotOwner');
    });
  });

  describe('distribute', function () {
    it('should distribute to beneficiaries', async function () {
      const instance = await getInstance();
      const { deployer, tokenDeploymentOutput } =
        await deployContractsAndToken();
      const framework = await deployer.getFramework();
      const ida = new InstantDistributionAgreementV1(
        framework.host,
        framework.ida,
      );

      await instance.initializeIDABeneficiary(
        await owner.getAddress(),
        tokenDeploymentOutput.nativeAssetSuperTokenData
          .nativeAssetSuperTokenAddress,
        [
          [await nomineeOwner.getAddress(), 1],
          [await nonOwner.getAddress(), 1],
        ],
      );

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
      const sub2 = await ida.getSubscription({
        superToken:
          tokenDeploymentOutput.nativeAssetSuperTokenData
            .nativeAssetSuperTokenAddress,
        indexId: '0',
        publisher: instance.address,
        subscriber: await nonOwner.getAddress(),
        providerOrSigner: owner,
      });

      expect(sub1.units).to.equal('1');
      expect(sub1.pendingDistribution).to.equal(ethers.utils.parseEther('0.5'));

      expect(sub2.units).to.equal('1');
      expect(sub2.pendingDistribution).to.equal(ethers.utils.parseEther('0.5'));
    });

    it('should fail if value is 0', async function () {
      const instance = await getInstance();
      const { tokenDeploymentOutput } = await deployContractsAndToken();

      await instance.initializeIDABeneficiary(
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
        'ImmutableIDABeneficiaryFacet: msg.value should be greater than 0',
      );
    });
  });
});
