import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

const name = 'ERC721Metadata.name';
const symbol = 'ERC721Metadata.symbol';
const tokenURI = 'ERC721Metadata.tokenURI';

describe('WrappedERC721StewardLicense', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let instance: any;
  let mockTokenInstance: any;

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
    const mockAuctionFactory = await ethers.getContractFactory(
      'PeriodicAuctionMock',
    );
    const mockAuction = await mockAuctionFactory.deploy();
    await mockAuction.deployed();

    const mockToken = await ethers.getContractFactory('SolidStateERC721Mock');
    mockTokenInstance = await mockToken.deploy(name, symbol, tokenURI);
    await mockTokenInstance.deployed();

    await mockTokenInstance.mint(owner.address, 1);
    await mockTokenInstance.mint(owner.address, 2);

    const facetFactory = await ethers.getContractFactory(
      'WrappedERC721StewardLicenseFacet',
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
      erc721Receiver.interface.getSighash(
        'onERC721Received(address,address,uint256,bytes)',
      ),
    ];

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
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: selectors,
      },
    ]);
    await instance.deployed();

    await mockTokenInstance
      .connect(owner)
      ['safeTransferFrom(address,address,uint256,bytes)'](
        owner.address,
        instance.address,
        1,
        ethers.utils.defaultAbiCoder.encode(['address'], [owner.address]),
      );

    instance = await ethers.getContractAt(
      'WrappedERC721StewardLicenseFacet',
      instance.address,
    );

    const auctionMockFacet = await ethers.getContractAt(
      'PeriodicAuctionMock',
      instance.address,
    );
    await auctionMockFacet['setIsAuctionPeriod(bool)'](false);
  });

  describe('onERC721Received', function () {
    it('should mint token to steward', async function () {
      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        await owner.getAddress(),
      );
    });

    it('should revert if already initialized', async function () {
      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256,bytes)'](
            owner.address,
            instance.address,
            2,
            ethers.utils.defaultAbiCoder.encode(['address'], [owner.address]),
          ),
      ).to.be.revertedWith(
        'WrappedERC721StewardLicenseFacet: already initialized',
      );
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
});
