import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { time } from '@nomicfoundation/hardhat-network-helpers';

function perYearToPerSecondRate(annualRate: number) {
  return {
    numerator: annualRate * 100,
    denominator: 60 * 60 * 24 * 365 * 100,
  };
}

describe('EnglishPeriodicAuction', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let instance: any;

  async function getInstance({
    auctionLengthSeconds = 100,
    licensePeriod = 1,
    initialPeriodStartTime = 2,
    startingBid = ethers.utils.parseEther('1'),
    bidExtensionWindowLengthSeconds = 10,
    bidExtensionSeconds = 20,
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
    const { numerator, denominator } = perYearToPerSecondRate(0.1);
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
            numerator,
            denominator,
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
          pcoParamsFacetInstance.interface.getSighash(
            'perSecondFeeNumerator()',
          ),
          pcoParamsFacetInstance.interface.getSighash(
            'perSecondFeeDenominator()',
          ),
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
          licenseMock.interface.getSighash('ownerOf(uint256)'),
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
        initData: facetInstance.interface.encodeFunctionData(
          'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256)',
          [
            await nonOwner.getAddress(),
            await owner.getAddress(),
            startingBid,
            auctionLengthSeconds,
            200,
            bidExtensionWindowLengthSeconds,
            bidExtensionSeconds,
          ],
        ),
        selectors: [
          facetFactory.interface.getSighash(
            'initializeAuction(address,address,uint256,uint256,uint256,uint256,uint256)',
          ),
          facetFactory.interface.getSighash('isAuctionPeriod()'),
          facetFactory.interface.getSighash('isReadyForTransfer()'),
          facetFactory.interface.getSighash('placeBid(uint256)'),
          facetFactory.interface.getSighash('closeAuction()'),
          facetFactory.interface.getSighash('calculateFeeFromBid(uint256)'),
          facetFactory.interface.getSighash('auctionLengthSeconds()'),
          facetFactory.interface.getSighash('minBidIncrement()'),
          facetFactory.interface.getSighash(
            'bidExtensionWindowLengthSeconds()',
          ),
          facetFactory.interface.getSighash('bidExtensionSeconds()'),
          facetFactory.interface.getSighash('bidOf(address)'),
          facetFactory.interface.getSighash('highestBid()'),
          facetFactory.interface.getSighash('currentBid()'),
          facetFactory.interface.getSighash('auctionStartTime()'),
          facetFactory.interface.getSighash('auctionEndTime()'),
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

  describe('calculateFeeFromBid', function () {
    it('should return correct fee amount', async function () {
      const instance = await getInstance({
        licensePeriod: 60 * 60 * 24 * 365,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const expectedFeeAmount = ethers.utils.parseEther('0.099999999988128000');

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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: collateralAmount }),
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: collateralAmount }),
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      const allowlistMock = await ethers.getContractAt(
        'AllowlistMock',
        instance.address,
      );
      await allowlistMock.setIsAllowed(false);

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: collateralAmount }),
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
      const collateralAmount1 = feeAmount1.add(ethers.utils.parseEther('1.0'));

      const bidAmount2 = ethers.utils.parseEther('1.1').add(100);
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount1, { value: collateralAmount1 });

      await expect(
        instance.connect(bidder2).placeBid(bidAmount2, {
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
      const collateralAmount1 = feeAmount1.add(ethers.utils.parseEther('1.0'));

      const bidAmount2 = ethers.utils.parseEther('0.9');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount1, { value: collateralAmount1 });

      await expect(
        instance.connect(bidder2).placeBid(bidAmount2, {
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: collateralAmount.add(1) }),
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
      const collateralAmount1 = feeAmount1.add(ethers.utils.parseEther('1.0'));

      const bidAmount2 = ethers.utils.parseEther('0.9');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount1, { value: collateralAmount1 });

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount2, { value: collateralAmount2 }),
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: collateralAmount.add(1) }),
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
          .placeBid(bidAmount, { value: collateralAmount }),
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(bidder1.address);
      const highestBid = await instance.highestBid();

      expect(bid.round).to.be.equal(1);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(1);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(bidder1.address);
      const highestBid = await instance.highestBid();

      expect(bid.round).to.be.equal(1);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(1);
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
      const collateralAmount1 = feeAmount1.add(ethers.utils.parseEther('1'));

      const bidAmount2 = ethers.utils.parseEther('1.2');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);
      const collateralAmount2 = feeAmount2.add(ethers.utils.parseEther('1'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount1, { value: collateralAmount1 });
      await instance.connect(bidder1).placeBid(bidAmount2, {
        value: collateralAmount2.sub(collateralAmount1),
      });

      const bid = await instance.bidOf(bidder1.address);
      const highestBid = await instance.highestBid();

      expect(bid.round).to.be.equal(1);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount2);
      expect(bid.collateralAmount).to.be.equal(collateralAmount2);

      expect(highestBid.round).to.be.equal(1);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount2);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount2);
    });

    it('should place bid if current bidder', async function () {
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
        .placeBid(bidAmount, { value: collateralAmount });

      const bid = await instance.bidOf(owner.address);
      const highestBid = await instance.highestBid();

      expect(bid.round).to.be.equal(1);
      expect(bid.bidder).to.be.equal(owner.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.feeAmount).to.be.equal(feeAmount);
      expect(bid.collateralAmount).to.be.equal(collateralAmount);

      expect(highestBid.round).to.be.equal(1);
      expect(highestBid.bidder).to.be.equal(owner.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.feeAmount).to.be.equal(feeAmount);
      expect(highestBid.collateralAmount).to.be.equal(collateralAmount);
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));
      const auctionStartTime = await instance.auctionStartTime();

      await instance
        .connect(bidder1)
        .placeBid(bidAmount, { value: collateralAmount });

      expect(await instance.auctionEndTime()).to.be.equal(
        auctionStartTime.add(300).add(100),
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

      await expect(instance.closeAuction()).to.be.revertedWith(
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
      const collateralAmount = feeAmount.add(ethers.utils.parseEther('1.0'));

      await instance
        .connect(bidder1)
        .placeBid(bidAmount, { value: collateralAmount });

      await time.increase(100);

      const oldBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      await instance.connect(bidder1).closeAuction();

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const oldBid = await instance.bidOf(owner.address);
      expect(oldBid.collateralAmount).to.be.equal(oldBid.bidAmount);

      const currentBid = await instance.currentBid();
      const highestBid = await instance.highestBid();
      const bidder1Bid = await instance.bidOf(bidder1.address);

      expect(currentBid.round).to.be.equal(1);
      expect(currentBid.bidder).to.be.equal(bidder1.address);
      expect(currentBid.bidAmount).to.be.equal(bidAmount);
      expect(currentBid.feeAmount).to.be.equal(feeAmount);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(bidder1Bid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(1);
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
        .placeBid(bidAmount, { value: collateralAmount });

      await time.increase(100);

      const oldBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      await instance.connect(owner).closeAuction();

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const ownerBid = await instance.bidOf(owner.address);
      const currentBid = await instance.currentBid();
      const highestBid = await instance.highestBid();

      expect(currentBid.round).to.be.equal(1);
      expect(currentBid.bidder).to.be.equal(owner.address);
      expect(currentBid.bidAmount).to.be.equal(bidAmount);
      expect(currentBid.feeAmount).to.be.equal(feeAmount);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(ownerBid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(1);
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

      await instance.connect(owner).closeAuction();

      const newBeneficiaryBalance = await ethers.provider.getBalance(
        nonOwner.address,
      );

      const repossessorBid = await instance.bidOf(nonOwner.address);
      const ownerBid = await instance.bidOf(owner.address);
      const currentBid = await instance.currentBid();
      const highestBid = await instance.highestBid();

      expect(currentBid.round).to.be.equal(1);
      expect(currentBid.bidder).to.be.equal(nonOwner.address);
      expect(currentBid.bidAmount).to.be.equal(0);
      expect(currentBid.feeAmount).to.be.equal(0);
      expect(currentBid.collateralAmount).to.be.equal(0);

      expect(repossessorBid.round).to.be.equal(1);
      expect(repossessorBid.bidder).to.be.equal(nonOwner.address);
      expect(repossessorBid.bidAmount).to.be.equal(0);
      expect(repossessorBid.feeAmount).to.be.equal(0);
      expect(repossessorBid.collateralAmount).to.be.equal(0);

      expect(ownerBid.collateralAmount).to.be.equal(0);

      expect(highestBid.round).to.be.equal(1);
      expect(highestBid.bidder).to.be.equal(nonOwner.address);
      expect(highestBid.bidAmount).to.be.equal(0);
      expect(highestBid.feeAmount).to.be.equal(0);
      expect(highestBid.collateralAmount).to.be.equal(0);

      expect(await licenseMock.ownerOf(0)).to.be.equal(nonOwner.address);

      // No fee is distributed to beneficiary
      expect(newBeneficiaryBalance.sub(oldBeneficiaryBalance)).to.be.equal(0);
    });
  });
});
