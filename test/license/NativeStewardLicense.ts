import {
  describeBehaviorOfERC721Base,
  describeBehaviorOfERC721Metadata,
} from '@solidstate/spec';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { time } from '@nomicfoundation/hardhat-network-helpers';

const name = 'ERC721Metadata.name';
const symbol = 'ERC721Metadata.symbol';
const tokenURI = 'ERC721Metadata.tokenURI';

describe('NativeStewardLicense', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let minter: SignerWithAddress;
  let instance: any;

  before(async function () {
    [, , , , owner, nonOwner, minter] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const erc721Base = await ethers.getContractAt(
      'ERC721Base',
      ethers.constants.AddressZero,
    );
    const erc721Metadata = await ethers.getContractAt(
      'ERC721Metadata',
      ethers.constants.AddressZero,
    );
    const erc721Receiver = await ethers.getContractAt(
      'IERC721Receiver',
      ethers.constants.AddressZero,
    );
    const mockAuctionFactory = await ethers.getContractFactory(
      'PeriodicAuctionMock',
    );
    const mockAuction = await mockAuctionFactory.deploy();
    await mockAuction.deployed();

    const facetFactory = await ethers.getContractFactory(
      'NativeStewardLicenseMock',
    );
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const factory = await ethers.getContractFactory('SingleCutDiamond');
    const selectors = [
      ...Object.keys(erc721Base.interface.functions)
        .filter((v) => v !== 'supportsInterface(bytes4)')
        .map((k) => erc721Base.interface.getSighash(k)),
      ...Object.keys(erc721Metadata.interface.functions).map((k) =>
        erc721Metadata.interface.getSighash(k),
      ),
      facetFactory.interface.getSighash(
        'initializeStewardLicense(address,address,uint256,string,string,string)',
      ),
      facetFactory.interface.getSighash('mint(address,uint256)'),
      facetFactory.interface.getSighash('burn(uint256)'),
      facetFactory.interface.getSighash(
        'triggerTransfer(address,address,uint256)',
      ),
      facetFactory.interface.getSighash('minter()'),
      facetFactory.interface.getSighash(
        'testTriggerTransfer(address,address,uint256)',
      ),
      erc721Receiver.interface.getSighash(
        'onERC721Received(address,address,uint256,bytes)',
      ),
      facetFactory.interface.getSighash('mintToken(address,uint256)'),
      facetFactory.interface.getSighash('maxTokenCount()'),
    ];

    const initData = facetInstance.interface.encodeFunctionData(
      'initializeStewardLicense(address,address,uint256,string,string,string)',
      [
        await minter.getAddress(),
        await owner.getAddress(),
        2,
        name,
        symbol,
        tokenURI,
      ],
    );
    instance = await factory.deploy([
      {
        target: mockAuction.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [
          mockAuction.interface.getSighash('isAuctionPeriod(uint256)'),
          mockAuction.interface.getSighash('setIsAuctionPeriod(bool)'),
          mockAuction.interface.getSighash('setShouldFail(bool)'),
          mockAuction.interface.getSighash('setInitialBidder(address)'),
          mockAuction.interface.getSighash(
            'setInitialPeriodStartTime(uint256)',
          ),
          mockAuction.interface.getSighash('initialBidder()'),
          mockAuction.interface.getSighash('initialPeriodStartTime()'),
        ],
      },
      {
        target: facetInstance.address,
        initTarget: facetInstance.address,
        initData,
        selectors: selectors,
      },
    ]);
    await instance.deployed();

    instance = await ethers.getContractAt(
      'NativeStewardLicenseMock',
      instance.address,
    );

    await instance.mint(await owner.getAddress(), 0);

    const auctionMockFacet = await ethers.getContractAt(
      'PeriodicAuctionMock',
      instance.address,
    );
    await auctionMockFacet['setIsAuctionPeriod(bool)'](false);
  });

  describeBehaviorOfERC721Base(async () => instance, {
    supply: ethers.constants.Zero,
    mint: (recipient, tokenId) => instance.mint(recipient, tokenId),
    burn: (tokenId) => instance.burn(tokenId),
  });

  describeBehaviorOfERC721Metadata(async () => instance, {
    name,
    symbol,
    tokenURI,
  });

  describe('initializeStewardLicense', function () {
    it('should revert if already initialized', async function () {
      await expect(
        instance[
          'initializeStewardLicense(address,address,uint256,string,string,string)'
        ](
          await minter.getAddress(),
          await owner.getAddress(),
          2,
          name,
          symbol,
          tokenURI,
        ),
      ).to.be.revertedWith('StewardLicenseFacet: already initialized');
    });

    it('should set minter', async function () {
      expect(await instance.minter()).to.be.equal(await minter.getAddress());
    });

    it('should set max token count', async function () {
      expect(await instance.maxTokenCount()).to.equal(2);
    });
  });

  describe('transfer', function () {
    it('should fail if during auction period', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );
      await auctionMockFacet['setIsAuctionPeriod(bool)'](true);

      await expect(
        instance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256)'](
            await owner.getAddress(),
            await nonOwner.getAddress(),
            0,
          ),
      ).to.be.revertedWith(
        'StewardLicenseFacet: Cannot transfer during auction period',
      );
    });

    it('should fail if call to auction fails', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );
      await auctionMockFacet['setShouldFail(bool)'](true);

      await expect(
        instance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256)'](
            await owner.getAddress(),
            await nonOwner.getAddress(),
            0,
          ),
      ).to.be.revertedWith('PeriodicAuctionMock: failed');
    });
  });

  describe('triggerTransfer', function () {
    it('should succeed if called by facet', async function () {
      await instance['testTriggerTransfer(address,address,uint256)'](
        await owner.getAddress(),
        await nonOwner.getAddress(),
        0,
      );

      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        await nonOwner.getAddress(),
      );
    });

    it('should succeed if receiver does not implement ERC721Receiver', async function () {
      const MockBidder = await ethers.getContractFactory('MockBidder');
      const mockBidder = await MockBidder.deploy(instance.address);
      await mockBidder.deployed();

      await instance['testTriggerTransfer(address,address,uint256)'](
        await owner.getAddress(),
        mockBidder.address,
        0,
      );

      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        mockBidder.address,
      );
    });

    it('should fail if not called by facet', async function () {
      await expect(
        instance['triggerTransfer(address,address,uint256)'](
          await owner.getAddress(),
          await nonOwner.getAddress(),
          0,
        ),
      ).to.be.revertedWith(
        'NativeStewardLicense: Trigger transfer can only be called from another facet',
      );
    });
  });

  describe('mintToken', function () {
    it('should allow mint from initial bidder if token does not exist', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);
      await auctionMockFacet.setInitialPeriodStartTime(
        (await time.latest()) + 100,
      );

      await instance.connect(minter).mintToken(nonOwner.address, 1);

      expect(await instance.ownerOf(1)).to.equal(nonOwner.address);
    });

    it('should not allow mint if not initial bidder', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);
      await auctionMockFacet.setInitialPeriodStartTime(
        (await time.latest()) + 100,
      );

      await expect(
        instance.connect(nonOwner).mintToken(nonOwner.address, 1),
      ).to.be.revertedWith(
        'StewardLicenseFacet: only initial bidder can mint token',
      );
    });

    it('should not allow mint if token exists', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);
      await auctionMockFacet.setInitialPeriodStartTime(
        (await time.latest()) + 100,
      );

      await expect(
        instance.connect(minter).mintToken(nonOwner.address, 0),
      ).to.be.revertedWith('StewardLicenseFacet: Token already exists');
    });

    it('should not allow mint if initial period has started', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);
      await auctionMockFacet.setInitialPeriodStartTime(0);

      await expect(
        instance.connect(minter).mintToken(nonOwner.address, 1),
      ).to.be.revertedWith(
        'StewardLicenseFacet: cannot mint after initial period start time',
      );
    });
  });
});
