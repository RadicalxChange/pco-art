import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('EnglishPeriodicAuction', function () {
  let owner: SignerWithAddress;
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
        target: facetInstance.address,
        initTarget: facetInstance.address,
        initData: facetInstance.interface.encodeFunctionData(
          'initializeAuction(uint256,uint256,uint256,uint256)',
          [auctionLengthSeconds, 200, 10, 20],
        ),
        selectors: [
          facetFactory.interface.getSighash(
            'initializeAuction(uint256,uint256,uint256,uint256)',
          ),
          facetFactory.interface.getSighash('isAuctionPeriod()'),
          facetFactory.interface.getSighash('triggerTransfer()'),
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
    [owner] = await ethers.getSigners();
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
        instance.initializeAuction(100, 200, 10, 20),
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

      await instance.triggerTransfer();

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

      await instance.triggerTransfer();
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

      await instance.triggerTransfer();
      await time.increase(1150);
      await instance.triggerTransfer();

      expect(await instance.isAuctionPeriod()).to.be.equal(false);
    });
  });
});
