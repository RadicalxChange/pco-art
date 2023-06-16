import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('EnglishPeriodicAuction', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let instance: any;

  async function getInstance({
    auctionLengthSeconds = 100,
    licensePeriod = 1,
    initialPeriodStartTime = 2,
  } = {}) {
    const pcoParamsFacetFactory = await ethers.getContractFactory(
      'OwnablePeriodicPCOParamsFacet',
    );
    const pcoParamsFacetInstance = await pcoParamsFacetFactory.deploy();
    await pcoParamsFacetInstance.deployed();

    const licenseMockFactory = await ethers.getContractFactory(
      'NativeStewardLicenseMock',
    );
    const licenseMock = await licenseMockFactory.deploy();
    await licenseMock.deployed();

    const beneficiaryFactory = await ethers.getContractFactory(
      'MockBeneficiary',
    );
    const beneficiaryMock = await beneficiaryFactory.deploy();
    await beneficiaryMock.deployed();

    const facetFactory = await ethers.getContractFactory(
      'EnglishPeriodicAuctionFacet',
    );
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const factory = await ethers.getContractFactory('SingleCutDiamond');
    instance = await factory.deploy([
      {
        target: pcoParamsFacetInstance.address,
        initTarget: pcoParamsFacetInstance.address,
        initData: pcoParamsFacetInstance.interface.encodeFunctionData(
          'initializePCOParams(address,uint256,uint256,uint256,uint256)',
          [
            await owner.getAddress(),
            licensePeriod,
            initialPeriodStartTime,
            3,
            4,
          ],
        ),
        selectors: [
          pcoParamsFacetInstance.interface.getSighash(
            'initializePCOParams(address,uint256,uint256,uint256,uint256)',
          ),
          pcoParamsFacetInstance.interface.getSighash(
            'initialPeriodStartTime()',
          ),
          pcoParamsFacetInstance.interface.getSighash('licensePeriod()'),
        ],
      },
      {
        target: licenseMock.address,
        initTarget: licenseMock.address,
        initData: licenseMock.interface.encodeFunctionData(
          'initializeStewardLicense(address,string,string,string)',
          [await owner.getAddress(), 'name', 'symbol', 'tokenURI'],
        ),
        selectors: [
          licenseMock.interface.getSighash(
            'initializeStewardLicense(address,string,string,string)',
          ),
          licenseMock.interface.getSighash(
            'triggerTransfer(address,address,uint256)',
          ),
        ],
      },
      {
        target: beneficiaryMock.address,
        initTarget: beneficiaryMock.address,
        initData: beneficiaryMock.interface.encodeFunctionData(
          'initializeMockBeneficiary(address)',
          [await owner.getAddress()],
        ),
        selectors: [
          beneficiaryMock.interface.getSighash(
            'initializeMockBeneficiary(address)',
          ),
          beneficiaryMock.interface.getSighash('distribute()'),
        ],
      },
      {
        target: facetInstance.address,
        initTarget: facetInstance.address,
        initData: facetInstance.interface.encodeFunctionData(
          'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256)',
          [
            await nonOwner.getAddress(),
            await owner.getAddress(),
            0,
            auctionLengthSeconds,
            200,
            10,
            20,
          ],
        ),
        selectors: [
          facetFactory.interface.getSighash(
            'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256)',
          ),
          facetFactory.interface.getSighash('isAuctionPeriod()'),
          facetFactory.interface.getSighash('isReadyForTransfer()'),
          facetFactory.interface.getSighash('closeAuction()'),
          facetFactory.interface.getSighash('auctionLengthSeconds()'),
          facetFactory.interface.getSighash('minBidIncrement()'),
          facetFactory.interface.getSighash(
            'bidExtensionWindowLengthSeconds()',
          ),
          facetFactory.interface.getSighash('bidExtensionSeconds()'),
        ],
      },
    ]);
    await instance.deployed();

    instance = await ethers.getContractAt(
      'EnglishPeriodicAuctionFacet',
      instance.address,
    );

    return instance;
  }

  before(async function () {
    [owner, nonOwner] = await ethers.getSigners();
  });

  describe('initializeAuction', function () {
    it('should set auctionLengthSeconds', async function () {
      const instance = await getInstance();

      expect(await instance.auctionLengthSeconds()).to.be.equal(100);
    });

    it('should set minBidIncrement', async function () {
      const instance = await getInstance();

      expect(await instance.minBidIncrement()).to.be.equal(200);
    });

    it('should set bidExtensionWindowLengthSeconds', async function () {
      const instance = await getInstance();

      expect(await instance.bidExtensionWindowLengthSeconds()).to.be.equal(10);
    });

    it('should set bidExtensionSeconds', async function () {
      const instance = await getInstance();

      expect(await instance.bidExtensionSeconds()).to.be.equal(20);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance();

      await expect(
        instance.initializeAuction(
          await nonOwner.getAddress(),
          await owner.getAddress(),
          0,
          100,
          200,
          10,
          20,
        ),
      ).to.be.revertedWith('EnglishPeriodicAuctionFacet: already initialized');
    });
  });

  describe('isAuctionPeriod', function () {
    it('should return true if initial auction is in progress', async function () {
      // Auction start: Now
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: await time.latest(),
      });

      expect(await instance.isAuctionPeriod()).to.be.equal(true);
    });

    it('should return false if initial auction ended', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // Next auction start: Now + 900
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();

      expect(await instance.isAuctionPeriod()).to.be.equal(false);
    });

    it('should return true if another auction is in progress', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // License period start: Now
      // Next auction start: Now + 1000
      // Next auction end: Now + 1100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();
      await time.increase(1050);

      expect(await instance.isAuctionPeriod()).to.be.equal(true);
    });

    it('should return false if another auction ended', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // License period start: Now
      // Next auction start: Now + 1000
      // Next auction end: Now + 1100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();
      await time.increase(1150);
      await instance.closeAuction();

      expect(await instance.isAuctionPeriod()).to.be.equal(false);
    });
  });

  describe('isReadyForTransfer', function () {
    it('should return false if initial auction is in progress', async function () {
      // Auction start: Now
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: await time.latest(),
      });

      expect(await instance.isReadyForTransfer()).to.be.equal(false);
    });

    it('should return true if initial auction ended', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // Next auction start: Now + 900
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      expect(await instance.isReadyForTransfer()).to.be.equal(true);
    });

    it('should return false if initial auction transferred', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // Next auction start: Now + 900
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();

      expect(await instance.isReadyForTransfer()).to.be.equal(false);
    });

    it('should return false if another auction is in progress', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // License period start: Now
      // Next auction start: Now + 1000
      // Next auction end: Now + 1100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();
      await time.increase(1050);

      expect(await instance.isReadyForTransfer()).to.be.equal(false);
    });

    it('should return true if another auction ended', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // License period start: Now
      // Next auction start: Now + 1000
      // Next auction end: Now + 1100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();
      await time.increase(1150);

      expect(await instance.isReadyForTransfer()).to.be.equal(true);
    });

    it('should return false if another auction transferred', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // License period start: Now
      // Next auction start: Now + 1000
      // Next auction end: Now + 1100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await instance.closeAuction();
      await time.increase(1150);
      await instance.closeAuction();

      expect(await instance.isReadyForTransfer()).to.be.equal(false);
    });
  });

  describe('closeAuction', function () {
    it('should revert if auction is not over', async function () {
      // Auction start: Now
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: await time.latest(),
      });

      await expect(instance.closeAuction()).to.be.revertedWith(
        'EnglishPeriodicAuction: auction is not over',
      );
    });
  });
});
