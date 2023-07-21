import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('EnglishPeriodicAuction', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let instance: any;

  async function getInstance({
    hasOwner = false,
    auctionLengthSeconds = 100,
    licensePeriod = 1,
    initialPeriodStartTime = 2,
    initialPeriodStartTimeOffset = 0,
    startingBid = ethers.utils.parseEther('1'),
    bidExtensionWindowLengthSeconds = 10,
    bidExtensionSeconds = 20,
  } = {}) {
    const pcoParamsFacetFactory = await ethers.getContractFactory(
      'PeriodicPCOParamsFacet',
    );
    const pcoParamsFacetInstance = await pcoParamsFacetFactory.deploy();
    await pcoParamsFacetInstance.deployed();

    const licenseMockFactory = await ethers.getContractFactory(
      'NativeStewardLicenseMock',
    );
    const licenseMock = await licenseMockFactory.deploy();
    await licenseMock.deployed();

    const beneficiaryFactory = await ethers.getContractFactory(
      'BeneficiaryMock',
    );
    const beneficiaryMock = await beneficiaryFactory.deploy();
    await beneficiaryMock.deployed();

    const allowlistFactory = await ethers.getContractFactory('AllowlistMock');
    const allowlistMock = await allowlistFactory.deploy();
    await allowlistMock.deployed();

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
          'initializePCOParams(address,uint256,uint256,uint256)',
          [await owner.getAddress(), licensePeriod, 1, 10],
        ),
        selectors: [
          pcoParamsFacetInstance.interface.getSighash(
            'initializePCOParams(address,uint256,uint256,uint256)',
          ),
          pcoParamsFacetInstance.interface.getSighash('licensePeriod()'),
          pcoParamsFacetInstance.interface.getSighash('feeNumerator()'),
          pcoParamsFacetInstance.interface.getSighash('feeDenominator()'),
        ],
      },
      {
        target: licenseMock.address,
        initTarget: licenseMock.address,
        initData: licenseMock.interface.encodeFunctionData(
          'initializeStewardLicense(address,address,string,string,string)',
          [
            await owner.getAddress(),
            await owner.getAddress(),
            'name',
            'symbol',
            'tokenURI',
          ],
        ),
        selectors: [
          licenseMock.interface.getSighash(
            'initializeStewardLicense(address,address,string,string,string)',
          ),
          licenseMock.interface.getSighash(
            'triggerTransfer(address,address,uint256)',
          ),
          licenseMock.interface.getSighash('ownerOf(uint256)'),
          licenseMock.interface.getSighash('mint(address,uint256)'),
          licenseMock.interface.getSighash('exists(uint256)'),
          licenseMock.interface.getSighash(
            'transferFrom(address,address,uint256)',
          ),
        ],
      },
      {
        target: beneficiaryMock.address,
        initTarget: beneficiaryMock.address,
        initData: beneficiaryMock.interface.encodeFunctionData(
          'initializeMockBeneficiary(address)',
          [await nonOwner.getAddress()],
        ),
        selectors: [
          beneficiaryMock.interface.getSighash(
            'initializeMockBeneficiary(address)',
          ),
          beneficiaryMock.interface.getSighash('distribute()'),
        ],
      },
      {
        target: allowlistMock.address,
        initTarget: allowlistMock.address,
        initData: allowlistMock.interface.encodeFunctionData(
          'setIsAllowed(bool)',
          [true],
        ),
        selectors: [
          allowlistMock.interface.getSighash('isAllowed(address)'),
          allowlistMock.interface.getSighash('setIsAllowed(bool)'),
        ],
      },
      {
        target: facetInstance.address,
        initTarget: facetInstance.address,
        initData: hasOwner
          ? facetInstance.interface.encodeFunctionData(
              'initializeAuction(address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
              [
                await owner.getAddress(),
                await nonOwner.getAddress(),
                await owner.getAddress(),
                initialPeriodStartTime,
                initialPeriodStartTimeOffset,
                startingBid,
                auctionLengthSeconds,
                200,
                bidExtensionWindowLengthSeconds,
                bidExtensionSeconds,
                10,
              ],
            )
          : facetInstance.interface.encodeFunctionData(
              'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
              [
                await nonOwner.getAddress(),
                await owner.getAddress(),
                initialPeriodStartTime,
                initialPeriodStartTimeOffset,
                startingBid,
                auctionLengthSeconds,
                200,
                bidExtensionWindowLengthSeconds,
                bidExtensionSeconds,
                10,
              ],
            ),
        selectors: [
          hasOwner
            ? facetFactory.interface.getSighash(
                'initializeAuction(address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
              )
            : facetFactory.interface.getSighash(
                'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)',
              ),
          facetFactory.interface.getSighash('isAuctionPeriod(uint256)'),
          facetFactory.interface.getSighash('isReadyForTransfer(uint256)'),
          facetFactory.interface.getSighash('placeBid(uint256,uint256)'),
          facetFactory.interface.getSighash('closeAuction(uint256)'),
          facetFactory.interface.getSighash('calculateFeeFromBid(uint256)'),
          facetFactory.interface.getSighash('maxTokenCount()'),
          facetFactory.interface.getSighash('repossessor()'),
          facetFactory.interface.getSighash('setRepossessor(address)'),
          facetFactory.interface.getSighash('initialPeriodStartTime()'),
          facetFactory.interface.getSighash('setAuctionLengthSeconds(uint256)'),
          facetFactory.interface.getSighash('auctionLengthSeconds()'),
          facetFactory.interface.getSighash('minBidIncrement()'),
          facetFactory.interface.getSighash('setMinBidIncrement(uint256)'),
          facetFactory.interface.getSighash(
            'setBidExtensionWindowLengthSeconds(uint256)',
          ),
          facetFactory.interface.getSighash(
            'bidExtensionWindowLengthSeconds()',
          ),
          facetFactory.interface.getSighash('bidExtensionSeconds()'),
          facetFactory.interface.getSighash('setBidExtensionSeconds(uint256)'),
          facetFactory.interface.getSighash('bidOf(uint256,address)'),
          facetFactory.interface.getSighash('highestBid(uint256)'),
          facetFactory.interface.getSighash('currentBid(uint256)'),
          facetFactory.interface.getSighash('auctionStartTime(uint256)'),
          facetFactory.interface.getSighash('auctionEndTime(uint256)'),
          facetFactory.interface.getSighash('withdrawBid(uint256)'),
          facetFactory.interface.getSighash('mintToken(address,uint256)'),
          facetFactory.interface.getSighash(
            'setAuctionParameters(address,uint256,uint256,uint256,uint256)',
          ),
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
    [owner, nonOwner, bidder1, bidder2] = await ethers.getSigners();
  });

  describe('initializeAuction', function () {
    it('should set repossessor', async function () {
      const instance = await getInstance();

      expect(await instance.repossessor()).to.be.equal(
        await nonOwner.getAddress(),
      );
    });

    it('should set max token count', async function () {
      const instance = await getInstance();

      expect(await instance.maxTokenCount()).to.be.equal(10);
    });

    it('should set initialPeriodStartTime', async function () {
      const instance = await getInstance();

      expect(await instance.initialPeriodStartTime()).to.be.equal(2);
    });

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
        instance[
          'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
        ](
          await nonOwner.getAddress(),
          await owner.getAddress(),
          2,
          0,
          0,
          100,
          200,
          10,
          20,
          10,
        ),
      ).to.be.revertedWith('EnglishPeriodicAuctionFacet: already initialized');
    });
  });

  describe('initializeAuction with owner', function () {
    it('should set repossessor', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.repossessor()).to.be.equal(
        await nonOwner.getAddress(),
      );
    });

    it('should set max token count', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.maxTokenCount()).to.be.equal(10);
    });

    it('should set initialPeriodStartTime', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.initialPeriodStartTime()).to.be.equal(2);
    });

    it('should set auctionLengthSeconds', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.auctionLengthSeconds()).to.be.equal(100);
    });

    it('should set minBidIncrement', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.minBidIncrement()).to.be.equal(200);
    });

    it('should set bidExtensionWindowLengthSeconds', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.bidExtensionWindowLengthSeconds()).to.be.equal(10);
    });

    it('should set bidExtensionSeconds', async function () {
      const instance = await getInstance({ hasOwner: true });

      expect(await instance.bidExtensionSeconds()).to.be.equal(20);
    });

    it('should revert if already initialized', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(
        instance[
          'initializeAuction(address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)'
        ](
          await owner.getAddress(),
          await nonOwner.getAddress(),
          await owner.getAddress(),
          2,
          0,
          0,
          100,
          200,
          10,
          20,
          10,
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

      expect(await instance.isAuctionPeriod(0)).to.be.equal(true);
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

      await instance.closeAuction(0);

      expect(await instance.isAuctionPeriod(0)).to.be.equal(false);
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

      await instance.closeAuction(0);
      await time.increase(1050);

      expect(await instance.isAuctionPeriod(0)).to.be.equal(true);
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

      await instance.closeAuction(0);
      await time.increase(1150);
      await instance.closeAuction(0);

      expect(await instance.isAuctionPeriod(0)).to.be.equal(false);
    });

    it('should offset auction starts', async function () {
      // Auction 0 start: Now - 100
      // Auction 0 end: Now
      // Auction 1 start: Now - 50
      // Auction 1 end: Now + 50
      // Auction 2 start: Now
      // Auction 2 end: Now + 100
      // Auction 3 start: Now + 50
      // Auction 3 end: Now + 150
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 100,
        initialPeriodStartTimeOffset: 50,
      });

      expect(await instance.isAuctionPeriod(0)).to.be.equal(true);
      expect(await instance.isAuctionPeriod(1)).to.be.equal(true);
      expect(await instance.isAuctionPeriod(2)).to.be.equal(true);
      expect(await instance.isAuctionPeriod(3)).to.be.equal(false);
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

      expect(await instance.isReadyForTransfer(0)).to.be.equal(false);
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

      expect(await instance.isReadyForTransfer(0)).to.be.equal(true);
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

      await instance.closeAuction(0);

      expect(await instance.isReadyForTransfer(0)).to.be.equal(false);
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

      await instance.closeAuction(0);
      await time.increase(1050);

      expect(await instance.isReadyForTransfer(0)).to.be.equal(false);
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

      await instance.closeAuction(0);
      await time.increase(1150);

      expect(await instance.isReadyForTransfer(0)).to.be.equal(true);
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

      await instance.closeAuction(0);
      await time.increase(1150);
      await instance.closeAuction(0);

      expect(await instance.isReadyForTransfer(0)).to.be.equal(false);
    });
  });

  describe('calculateFeeFromBid', function () {
    it('should return correct fee amount', async function () {
      const instance = await getInstance();

      const bidAmount = ethers.utils.parseEther('1');
      const expectedFeeAmount = ethers.utils.parseEther('0.1');

      expect(await instance.calculateFeeFromBid(bidAmount)).to.be.equal(
        expectedFeeAmount,
      );
    });
  });

  describe('placeBid', function () {
    it('should revert if not in auction period', async function () {
      // Auction start: Now + 200
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) + 200,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: can only place bid in auction period',
      );
    });

    it('should revert if auction is over and ready for transfer', async function () {
      // Auction start: Now - 200
      // Auction end: Now - 100
      // Next auction start: Now + 900
      const instance = await getInstance({
        auctionLengthSeconds: 100,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: auction is over and awaiting transfer',
      );
    });

    it('should revert if bidder is not allowed', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      const allowlistMock = await ethers.getContractAt(
        'AllowlistMock',
        instance.address,
      );
      await allowlistMock.setIsAllowed(false);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: sender is not allowed to place bid',
      );
    });

    it('should revert if bid does not reach minimum increment', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.1').add(100);
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await expect(
        instance.connect(bidder2).placeBid(0, bidAmount2, {
          value: collateralAmount2,
        }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid',
      );
    });

    it('should revert if bid is not highest', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('0.9');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await expect(
        instance.connect(bidder2).placeBid(0, bidAmount2, {
          value: collateralAmount2,
        }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid',
      );
    });

    it('should revert if bid amount is not correct', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount.add(1) }),
      ).to.be.revertedWith('EnglishPeriodicAuction: Incorrect bid amount');
    });

    it('should revert if current highest bidder tries to lower bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('0.9');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount2, { value: collateralAmount2 }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: Bid amount must be greater than highest outstanding bid',
      );
    });

    it('should revert if bid amount is not correct', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount.add(1) }),
      ).to.be.revertedWith('EnglishPeriodicAuction: Incorrect bid amount');
    });

    it('should revert if collateral does not cover current bid amount', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('0.9');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount;

      await expect(
        instance
          .connect(bidder1)
          .placeBid(0, bidAmount, { value: collateralAmount }),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: Collateral must be greater than current bid',
      );
    });

    it('should place new bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(0, bidder1.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);
    });

    it('should place new highest bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await instance
        .connect(bidder2)
        .placeBid(0, bidAmount2, { value: collateralAmount2 });

      const bid = await instance.bidOf(0, bidder2.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(bidder2.address);
      expect(bid.bidAmount).to.be.equal(bidAmount2);
      expect(bid.feeAmount).to.be.equal(feeAmount2);
      expect(bid.collateralAmount).to.be.equal(collateralAmount2);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder2.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount2);
      expect(highestBid.feeAmount).to.be.equal(feeAmount2);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount2);
    });

    it('should place bid lower than old bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('0.9');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(0, bidder1.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);
    });

    it('should place additional bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });
      await instance.connect(bidder1).placeBid(0, bidAmount2, {
        value: collateralAmount2.sub(collateralAmount1),
      });

      const bid = await instance.bidOf(0, bidder1.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount2);
      expect(bid.collateralAmount).to.be.equal(collateralAmount2);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount2);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount2);
    });

    it('should place bid in another round', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await instance
        .connect(bidder2)
        .placeBid(0, bidAmount2, { value: collateralAmount2 });

      await time.increase(100);

      await instance.connect(bidder1).closeAuction(0);

      await time.increase(1100);

      const bidAmount3 = ethers.utils.parseEther('1.1');
      const feeAmount3 = await instance.calculateFeeFromBid(bidAmount3);
      const collateralAmount3 = feeAmount3.add(bidAmount3);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount3, { value: collateralAmount3 });

      const bid = await instance.bidOf(0, bidder1.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(1);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount3);
      expect(bid.feeAmount).to.be.equal(feeAmount3);
      expect(bid.collateralAmount).to.be.equal(collateralAmount3);

      expect(highestBid.round).to.be.equal(1);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount3);
      expect(highestBid.feeAmount).to.be.equal(feeAmount3);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount3);
    });

    it('should place bid if current steward', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount;

      await instance
        .connect(owner)
        .placeBid(0, bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(0, owner.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(owner.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(owner.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);
    });

    it('should place additional bid if current steward', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1;

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2;

      await instance
        .connect(owner)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });
      await instance.connect(owner).placeBid(0, bidAmount2, {
        value: collateralAmount2.sub(collateralAmount1),
      });

      const bid = await instance.bidOf(0, owner.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(owner.address);
      expect(bid.bidAmount).to.be.equal(bidAmount2);
      expect(bid.collateralAmount).to.be.equal(collateralAmount2);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(owner.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount2);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount2);
    });

    it('should place new highest bid if current steward', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2;

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await instance
        .connect(owner)
        .placeBid(0, bidAmount2, { value: collateralAmount2 });

      const bid = await instance.bidOf(0, owner.address);
      const highestBid = await instance.highestBid(0);

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(owner.address);
      expect(bid.bidAmount).to.be.equal(bidAmount2);
      expect(bid.feeAmount).to.be.equal(feeAmount2);
      expect(bid.collateralAmount).to.be.equal(collateralAmount2);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(owner.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount2);
      expect(highestBid.feeAmount).to.be.equal(feeAmount2);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount2);
    });

    it('should extend auction if bid placed in extension window', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
        bidExtensionWindowLengthSeconds: 150,
        bidExtensionSeconds: 100,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);
      const auctionStartTime = await instance.auctionStartTime(0);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      expect(await instance.auctionEndTime(0)).to.be.equal(
        auctionStartTime.add(300).add(100),
      );
    });

    it('should extend auction for token that has previously been extended', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
        bidExtensionWindowLengthSeconds: 150,
        bidExtensionSeconds: 100,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);
      const auctionStartTime = await instance.auctionStartTime(0);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);
      await instance
        .connect(bidder2)
        .placeBid(0, bidAmount2, { value: collateralAmount2 });

      expect(await instance.auctionEndTime(0)).to.be.equal(
        auctionStartTime.add(300).add(200),
      );
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

      await expect(instance.closeAuction(0)).to.be.revertedWith(
        'EnglishPeriodicAuction: auction is not over',
      );
    });

    it('should close auction with bids', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });
      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      const bidAmount = ethers.utils.parseEther('0.9');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);

      const oldBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      await instance.connect(bidder1).closeAuction(0);

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const oldBid = await instance.bidOf(0, owner.address);
      expect(oldBid.collateralAmount).to.be.equal(bidAmount);

      const currentBid = await instance.currentBid(0);
      const highestBid = await instance.highestBid(0);
      const bidder1Bid = await instance.bidOf(0, bidder1.address);

      expect(currentBid.round).to.be.equal(0);
      expect(currentBid.bidder).to.be.equal(bidder1.address);
      expect(currentBid.bidAmount).to.be.equal(bidAmount);
      expect(currentBid.feeAmount).to.be.equal(feeAmount);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(bidder1Bid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);

      expect(await licenseMock.ownerOf(0)).to.be.equal(bidder1.address);

      // Fee is distributed to beneficiary
      expect(newBeneficiaryBalance.sub(oldBeneficiaryBalance)).to.be.equal(
        feeAmount,
      );
    });

    it('should close auction with no bids besides owner', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });
      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      const bidAmount = ethers.utils.parseEther('0.9');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount;

      await instance
        .connect(owner)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);

      const oldBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      await instance.connect(owner).closeAuction(0);

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const ownerBid = await instance.bidOf(0, owner.address);
      const currentBid = await instance.currentBid(0);
      const highestBid = await instance.highestBid(0);

      expect(currentBid.round).to.be.equal(0);
      expect(currentBid.bidder).to.be.equal(owner.address);
      expect(currentBid.bidAmount).to.be.equal(bidAmount);
      expect(currentBid.feeAmount).to.be.equal(feeAmount);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(ownerBid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(owner.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);

      expect(await licenseMock.ownerOf(0)).to.be.equal(owner.address);

      // Fee is distributed to beneficiary
      expect(newBeneficiaryBalance.sub(oldBeneficiaryBalance)).to.be.equal(
        feeAmount,
      );
    });

    it('should close auction with no bids', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });
      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      await time.increase(100);

      const oldBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      await instance.connect(owner).closeAuction(0);

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const repossessorBid = await instance.bidOf(0, nonOwner.address);
      const ownerBid = await instance.bidOf(0, owner.address);
      const currentBid = await instance.currentBid(0);
      const highestBid = await instance.highestBid(0);

      expect(currentBid.round).to.be.equal(0);
      expect(currentBid.bidder).to.be.equal(nonOwner.address);
      expect(currentBid.bidAmount).to.be.equal(0);
      expect(currentBid.feeAmount).to.be.equal(0);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(repossessorBid.round).to.be.equal(0);
      expect(repossessorBid.bidder).to.be.equal(nonOwner.address);
      expect(repossessorBid.bidAmount).to.be.equal(0);
      expect(repossessorBid.feeAmount).to.be.equal(0);
      expect(repossessorBid.collateralAmount).to.be.equal(0);

      expect(ownerBid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(nonOwner.address);
      expect(highestBid.bidAmount).to.be.equal(0);
      expect(highestBid.feeAmount).to.be.equal(0);
      expect(highestBid.collateralAmount).to.be.equal(0);

      expect(await licenseMock.ownerOf(0)).to.be.equal(nonOwner.address);

      // No fee is distributed to beneficiary
      expect(newBeneficiaryBalance.sub(oldBeneficiaryBalance)).to.be.equal(0);
    });
  });

  describe('withdrawBid', function () {
    it('should revert if current bidder tries to withdraw bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await expect(instance.connect(owner).withdrawBid(0)).to.be.revertedWith(
        'EnglishPeriodicAuction: Cannot withdraw bid if current bidder',
      );
    });

    it('should revert if highest bidder tries to withdraw bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await expect(instance.connect(bidder1).withdrawBid(0)).to.be.revertedWith(
        'EnglishPeriodicAuction: Cannot withdraw bid if highest bidder',
      );
    });

    it('should revert if no collateral to withdraw', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      await time.increase(100);

      await instance.connect(owner).closeAuction(0);

      await expect(instance.connect(owner).withdrawBid(0)).to.be.revertedWith(
        'EnglishPeriodicAuction: No collateral to withdraw',
      );
    });

    it('should revert if caller fails to accept transfer', async function () {
      // Auction start: Now + 200
      // Auction end: Now + 500
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) + 200,
        licensePeriod: 1000,
      });
      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      // MockBidder
      const MockBidder = await ethers.getContractFactory('MockBidder');
      const mockBidder = await MockBidder.deploy(instance.address);
      await mockBidder.deployed();

      await licenseMock.connect(owner).mint(mockBidder.address, 0);

      await time.increase(400);

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);

      await instance.connect(owner).closeAuction(0);

      await expect(mockBidder.withdrawBid(0)).to.be.revertedWith(
        'EnglishPeriodicAuction: Failed to withdraw collateral',
      );
    });

    it('should allow withdraw after being out bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await instance.connect(bidder2).placeBid(0, bidAmount2, {
        value: collateralAmount2,
      });

      const oldBidderBalance = await ethers.provider.getBalance(
        bidder1.address,
      );
      const res = await instance.connect(bidder1).withdrawBid(0);
      const receipt = await res.wait();
      const gasFee = receipt.gasUsed.mul(res.gasPrice);

      const newBidderBalance = await ethers.provider.getBalance(
        bidder1.address,
      );

      // Expect bidder1 balance to increase by collateralAmount1
      expect(newBidderBalance.add(gasFee).sub(oldBidderBalance)).to.be.equal(
        collateralAmount1,
      );
    });

    it('should allow withdraw after losing auction', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount1 = ethers.utils.parseEther('1.1');
      const feeAmount1 = await instance.calculateFeeFromBid(bidAmount1);
      const collateralAmount1 = feeAmount1.add(bidAmount1);

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount1, { value: collateralAmount1 });

      await instance.connect(bidder2).placeBid(0, bidAmount2, {
        value: collateralAmount2,
      });

      await time.increase(100);
      await instance.closeAuction(0);

      const oldBidderBalance = await ethers.provider.getBalance(
        bidder1.address,
      );
      const res = await instance.connect(bidder1).withdrawBid(0);
      const receipt = await res.wait();
      const gasFee = receipt.gasUsed.mul(res.gasPrice);

      const newBidderBalance = await ethers.provider.getBalance(
        bidder1.address,
      );

      // Expect bidder1 balance to increase by collateralAmount1
      expect(newBidderBalance.add(gasFee).sub(oldBidderBalance)).to.be.equal(
        collateralAmount1,
      );
    });

    it('should allow withdraw of owner bid amount after auction', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);
      await instance.closeAuction(0);

      const oldOwnerBalance = await ethers.provider.getBalance(owner.address);
      const res = await instance.connect(owner).withdrawBid(0);
      const receipt = await res.wait();
      const gasFee = receipt.gasUsed.mul(res.gasPrice);

      const newOwnerBalance = await ethers.provider.getBalance(owner.address);

      // Expect owner balance to increase by bid amount
      expect(newOwnerBalance.add(gasFee).sub(oldOwnerBalance)).to.be.equal(
        bidAmount,
      );
    });

    it('should allow withdraw of owner bid if ownership transferred during license period', async function () {
      // Auction start: Now + 200
      // Auction end: Now + 500
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) + 200,
        licensePeriod: 1000,
      });
      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      await licenseMock.connect(owner).mint(nonOwner.address, 0);

      await time.increase(400);

      const bidAmount = ethers.utils.parseEther('1.1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);
      const collateralAmount = feeAmount.add(bidAmount);

      await instance
        .connect(bidder1)
        .placeBid(0, bidAmount, { value: collateralAmount });

      await time.increase(100);

      await instance.connect(owner).closeAuction(0);

      const oldOwnerBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );
      const res = await instance.connect(nonOwner).withdrawBid(0);
      const receipt = await res.wait();
      const gasFee = receipt.gasUsed.mul(res.gasPrice);

      const newOwnerBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      // Expect owner balance to increase by bid amount
      expect(newOwnerBalance.add(gasFee).sub(oldOwnerBalance)).to.be.equal(
        bidAmount,
      );
    });
  });

  describe('setAuctionParameters', function () {
    it('should allow owner to set', async function () {
      const instance = await getInstance({ hasOwner: true });

      instance.setAuctionParameters(bidder1.address, 101, 201, 11, 21);
      expect(await instance.repossessor()).to.equal(bidder1.address);
      expect(await instance.auctionLengthSeconds()).to.equal(101);
      expect(await instance.minBidIncrement()).to.equal(201);
      expect(await instance.bidExtensionWindowLengthSeconds()).to.equal(11);
      expect(await instance.bidExtensionSeconds()).to.equal(21);
    });

    it('should not allow non-owner to set', async function () {
      const instance = await getInstance();

      await expect(
        instance
          .connect(nonOwner)
          .setAuctionParameters(bidder1.address, 101, 201, 11, 21),
      ).to.be.reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(
        instance
          .connect(owner)
          .setAuctionParameters(bidder1.address, 101, 201, 11, 21),
      ).to.be.reverted;
    });
  });

  describe('setRepossessor', function () {
    it('should allow owner to set repossessor', async function () {
      const instance = await getInstance({ hasOwner: true });

      await instance.connect(owner).setRepossessor(nonOwner.address);

      expect(await instance.repossessor()).to.equal(nonOwner.address);
    });

    it('should not allow non-owner to set repossessor', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(instance.connect(nonOwner).setRepossessor(nonOwner.address))
        .to.be.reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(instance.connect(owner).setRepossessor(nonOwner.address)).to
        .be.reverted;
    });
  });

  describe('setAuctionLengthSeconds', function () {
    it('should allow owner to set auction length', async function () {
      const instance = await getInstance({ hasOwner: true });

      await instance.connect(owner).setAuctionLengthSeconds(123);

      expect(await instance.auctionLengthSeconds()).to.equal(123);
    });

    it('should not allow non-owner to set auction length', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(instance.connect(nonOwner).setAuctionLengthSeconds(123)).to
        .be.reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(instance.connect(owner).setAuctionLengthSeconds(123)).to.be
        .reverted;
    });
  });

  describe('setMinBidIncrement', function () {
    it('should allow owner to set min bid increment', async function () {
      const instance = await getInstance({ hasOwner: true });

      await instance.connect(owner).setMinBidIncrement(123);

      expect(await instance.minBidIncrement()).to.equal(123);
    });

    it('should not allow non-owner to set min bid increment', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(instance.connect(nonOwner).setMinBidIncrement(123)).to.be
        .reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(instance.connect(owner).setMinBidIncrement(123)).to.be
        .reverted;
    });
  });

  describe('setBidExtensionSeconds', function () {
    it('should allow owner to set bid extension', async function () {
      const instance = await getInstance({ hasOwner: true });

      await instance.connect(owner).setBidExtensionSeconds(123);

      expect(await instance.bidExtensionSeconds()).to.equal(123);
    });

    it('should not allow non-owner to set bid extension', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(instance.connect(nonOwner).setBidExtensionSeconds(123)).to.be
        .reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(instance.connect(owner).setBidExtensionSeconds(123)).to.be
        .reverted;
    });
  });

  describe('setBidExtensionWindowLengthSeconds', function () {
    it('should allow owner to set bid extension window length', async function () {
      const instance = await getInstance({ hasOwner: true });

      await instance.connect(owner).setBidExtensionWindowLengthSeconds(123);

      expect(await instance.bidExtensionWindowLengthSeconds()).to.equal(123);
    });

    it('should not allow non-owner to set bid extension window length', async function () {
      const instance = await getInstance({ hasOwner: true });

      await expect(
        instance.connect(nonOwner).setBidExtensionWindowLengthSeconds(123),
      ).to.be.reverted;
    });

    it('should not allow anyone to set when no owner', async function () {
      const instance = await getInstance({ hasOwner: false });

      await expect(
        instance.connect(owner).setBidExtensionWindowLengthSeconds(123),
      ).to.be.reverted;
    });
  });

  describe('mintToken', function () {
    it('should allow mint from initial bidder if token does not exist', async function () {
      const instance = await getInstance({
        initialPeriodStartTime: (await time.latest()) + 100,
      });

      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      await instance.connect(owner).mintToken(bidder1.address, 0);

      expect(await licenseMock.ownerOf(0)).to.equal(bidder1.address);
    });

    it('should not allow mint if not initial bidder', async function () {
      const instance = await getInstance({
        initialPeriodStartTime: (await time.latest()) + 100,
      });

      await expect(
        instance.connect(nonOwner).mintToken(bidder1.address, 0),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: only initial bidder can mint token',
      );
    });

    it('should not allow mint if token exists', async function () {
      const instance = await getInstance({
        initialPeriodStartTime: (await time.latest()) + 100,
      });

      const licenseMock = await ethers.getContractAt(
        'NativeStewardLicenseMock',
        instance.address,
      );

      await licenseMock.connect(owner).mint(bidder1.address, 0);

      await expect(
        instance.connect(owner).mintToken(bidder1.address, 0),
      ).to.be.revertedWith('EnglishPeriodicAuction: Token already exists');
    });

    it('should not allow mint if initial period has started', async function () {
      const instance = await getInstance({
        initialPeriodStartTime: (await time.latest()) - 100,
      });

      await expect(
        instance.connect(owner).mintToken(bidder1.address, 0),
      ).to.be.revertedWith(
        'EnglishPeriodicAuction: cannot mint after initial period start time',
      );
    });
  });
});
