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

      await expect(
        instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount }),
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

      await expect(
        instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount }),
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

      const allowlistMock = await ethers.getContractAt(
        'AllowlistMock',
        instance.address,
      );
      await allowlistMock.setIsAllowed(false);

      await expect(
        instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount }),
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

      const bidAmount = 150;
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);

      await expect(
        instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount }),
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

      const bidAmount2 = ethers.utils.parseEther('0.9');
      const feeAmount2 = await instance.calculateFeeFromBid(bidAmount2);

      await instance
        .connect(bidder1)
        .placeBid(bidAmount1, { value: feeAmount1 });

      await expect(
        instance.connect(bidder2).placeBid(bidAmount2, { value: feeAmount2 }),
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

      await expect(
        instance
          .connect(bidder1)
          .placeBid(bidAmount, { value: feeAmount.add(1) }),
      ).to.be.revertedWith('EnglishPeriodicAuction: Incorrect bid amount');
    });

    it('should revert if bid amount is not correct for existing bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);

      await instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount });

      await expect(
        instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount }),
      ).to.be.revertedWith('EnglishPeriodicAuction: Incorrect bid amount');
    });

    it('should place new bid', async function () {
      // Auction start: Now - 200
      // Auction end: Now + 100
      const instance = await getInstance({
        auctionLengthSeconds: 300,
        initialPeriodStartTime: (await time.latest()) - 200,
        licensePeriod: 1000,
      });

      const bidAmount = ethers.utils.parseEther('1');
      const feeAmount = await instance.calculateFeeFromBid(bidAmount);

      await instance.connect(bidder1).placeBid(bidAmount, { value: feeAmount });

      const bid = await instance.bidOf(bidder1.address);
      const highestBid = await instance.highestBid();

      expect(bid.round).to.be.equal(0);
      expect(bid.bidder).to.be.equal(bidder1.address);
      expect(bid.bidAmount).to.be.equal(bidAmount);
      expect(bid.collateralAmount).to.be.equal(feeAmount);

      expect(highestBid.round).to.be.equal(0);
      expect(highestBid.bidder).to.be.equal(bidder1.address);
      expect(highestBid.bidAmount).to.be.equal(bidAmount);
      expect(highestBid.collateralAmount).to.be.equal(feeAmount);
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
