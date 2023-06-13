import {
  describeBehaviorOfERC721Base,
  describeBehaviorOfERC721Metadata,
} from '@solidstate/spec';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

const name = 'ERC721Metadata.name';
const symbol = 'ERC721Metadata.symbol';
const tokenURI = 'ERC721Metadata.tokenURI';

describe('NativeStewardLicense', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let instance: any;

  before(async function () {
    [, , , , owner, nonOwner] = await ethers.getSigners();
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
    const mockAuctionFactory = await ethers.getContractFactory('AuctionMock');
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
        'initializeStewardLicense(address,string,string,string)',
      ),
      facetFactory.interface.getSighash('mint(address,uint256)'),
      facetFactory.interface.getSighash('burn(uint256)'),
      erc721Receiver.interface.getSighash(
        'onERC721Received(address,address,uint256,bytes)',
      ),
    ];

    const initData = facetInstance.interface.encodeFunctionData(
      'initializeStewardLicense(address,string,string,string)',
      [await owner.getAddress(), name, symbol, tokenURI],
    );
    instance = await factory.deploy([
      {
        target: mockAuction.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [
          mockAuction.interface.getSighash('isAuctionPeriod()'),
          mockAuction.interface.getSighash('setIsAuctionPeriod(bool)'),
          mockAuction.interface.getSighash('setShouldFail(bool)'),
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

    const auctionMockFacet = await ethers.getContractAt(
      'AuctionMock',
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
    it('should mint token to steward', async function () {
      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        await owner.getAddress(),
      );
    });

    it('should revert if already initialized', async function () {
      await expect(
        instance['initializeStewardLicense(address,string,string,string)'](
          await owner.getAddress(),
          name,
          symbol,
          tokenURI,
        ),
      ).to.be.revertedWith('StewardLicenseFacet: already initialized');
    });
  });

  describe('transfer', function () {
    it('should fail if during auction period', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'AuctionMock',
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
        'AuctionMock',
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
      ).to.be.revertedWith('StewardLicenseFacet: isAuctionPeriod() failed');
    });
  });
});
