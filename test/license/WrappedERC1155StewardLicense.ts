import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

const name = 'ERC721Metadata.name';
const symbol = 'ERC721Metadata.symbol';
const tokenURI = 'ERC721Metadata.tokenURI';

describe('WrappedERC1155StewardLicense', function () {
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let minter: SignerWithAddress;
  let mockTokenInstance: any;
  let mockTokenInstance1: any;

  before(async function () {
    [, , , , owner, nonOwner, minter] = await ethers.getSigners();
  });

  async function deployFacet(initialize = true) {
    const erc721Base = await ethers.getContractAt(
      'ERC721Base',
      ethers.constants.AddressZero,
    );
    const erc721Metadata = await ethers.getContractAt(
      'ERC721Metadata',
      ethers.constants.AddressZero,
    );
    const erc1155Receiver = await ethers.getContractAt(
      'IERC1155Receiver',
      ethers.constants.AddressZero,
    );
    const mockAuctionFactory = await ethers.getContractFactory(
      'PeriodicAuctionMock',
    );
    const mockAuction = await mockAuctionFactory.deploy();
    await mockAuction.deployed();

    const mockToken = await ethers.getContractFactory('SolidStateERC1155Mock');
    mockTokenInstance = await mockToken.deploy(tokenURI);
    await mockTokenInstance.deployed();

    await mockTokenInstance.__mint(owner.address, 1, 2);
    await mockTokenInstance.__mint(owner.address, 2, 1);

    mockTokenInstance1 = await mockToken.deploy(tokenURI);
    await mockTokenInstance1.deployed();

    await mockTokenInstance1.__mint(owner.address, 1, 2);

    const facetFactory = await ethers.getContractFactory(
      'WrappedERC1155StewardLicenseMock',
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
      erc1155Receiver.interface.getSighash(
        'onERC1155Received(address,address,uint256,uint256,bytes)',
      ),
      erc1155Receiver.interface.getSighash(
        'onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)',
      ),
      facetFactory.interface.getSighash(
        'initializeWrappedStewardLicense(address,uint256,address,address,address,uint256,bool,string,string,string)',
      ),
      facetFactory.interface.getSighash('mint(address,uint256)'),
      facetFactory.interface.getSighash('minter()'),
      facetFactory.interface.getSighash('maxTokenCount()'),
    ];

    let instance = await factory.connect(owner).deploy([
      {
        target: mockAuction.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [
          mockAuction.interface.getSighash('isAuctionPeriod(uint256)'),
          mockAuction.interface.getSighash('setIsAuctionPeriod(bool)'),
          mockAuction.interface.getSighash('setShouldFail(bool)'),
        ],
      },
      {
        target: facetInstance.address,
        initTarget: initialize
          ? facetInstance.address
          : ethers.constants.AddressZero,
        initData: initialize
          ? facetInstance.interface.encodeFunctionData(
              'initializeWrappedStewardLicense(address,uint256,address,address,address,uint256,bool,string,string,string)',
              [
                mockTokenInstance.address,
                1,
                await owner.getAddress(),
                await minter.getAddress(),
                await owner.getAddress(),
                2,
                false,
                name,
                symbol,
                tokenURI,
              ],
            )
          : '0x',
        selectors: selectors,
      },
    ]);
    await instance.deployed();

    instance = await ethers.getContractAt(
      'WrappedERC721StewardLicenseMock',
      instance.address,
    );

    await instance.mint(await owner.getAddress(), 0);

    const auctionMockFacet = await ethers.getContractAt(
      'PeriodicAuctionMock',
      instance.address,
    );
    await auctionMockFacet['setIsAuctionPeriod(bool)'](false);

    return instance;
  }

  describe('initializeWrappedStewardLicense', function () {
    it('should revert if already initialized', async function () {
      const instance = await deployFacet();

      await expect(
        instance.initializeWrappedStewardLicense(
          mockTokenInstance.address,
          1,
          await owner.getAddress(),
          await minter.getAddress(),
          await owner.getAddress(),
          2,
          false,
          name,
          symbol,
          tokenURI,
        ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: already initialized',
      );
    });

    it('should set minter', async function () {
      const instance = await deployFacet();

      expect(await instance.minter()).to.be.equal(await owner.getAddress());
    });

    it('should set max token count', async function () {
      const instance = await deployFacet();

      expect(await instance.maxTokenCount()).to.equal(2);
    });
  });

  describe('onERC1155Received', function () {
    it('should mint token to steward', async function () {
      const instance = await deployFacet();

      await mockTokenInstance
        .connect(owner)
        ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
          owner.address,
          instance.address,
          1,
          1,
          '0x',
        );

      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        await owner.getAddress(),
      );
    });

    it('should revert if sending multiple tokens', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
            owner.address,
            instance.address,
            1,
            2,
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: can only receive one token',
      );
    });

    it('should revert if not initialized yet', async function () {
      const instance = await deployFacet(false);

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
            owner.address,
            instance.address,
            1,
            1,
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: must be initialized',
      );
    });

    it('should revert if wrong token address', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance1
          .connect(owner)
          ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
            owner.address,
            instance.address,
            1,
            1,
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: cannot accept this token address',
      );
    });

    it('should revert if wrong token id', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
            owner.address,
            instance.address,
            2,
            1,
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: cannot accept this token ID',
      );
    });
  });

  describe('onERC1155BatchReceived', function () {
    it('should mint token to steward', async function () {
      const instance = await deployFacet();

      await mockTokenInstance
        .connect(owner)
        ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
          owner.address,
          instance.address,
          [1],
          [1],
          '0x',
        );

      expect(await instance.ownerOf(ethers.constants.Zero)).to.be.equal(
        await owner.getAddress(),
      );
    });

    it('should revert if sending multiple tokens', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
            owner.address,
            instance.address,
            [1, 2],
            [1, 1],
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: can only receive one token',
      );
    });

    it('should revert if sending multiple of same token', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
            owner.address,
            instance.address,
            [1],
            [2],
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: can only receive one token',
      );
    });

    it('should revert if not initialized yet', async function () {
      const instance = await deployFacet(false);

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
            owner.address,
            instance.address,
            [1],
            [1],
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: must be initialized',
      );
    });

    it('should revert if wrong token address', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance1
          .connect(owner)
          ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
            owner.address,
            instance.address,
            [1],
            [1],
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: cannot accept this token address',
      );
    });

    it('should revert if wrong token id', async function () {
      const instance = await deployFacet();

      await expect(
        mockTokenInstance
          .connect(owner)
          ['safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'](
            owner.address,
            instance.address,
            [2],
            [1],
            '0x',
          ),
      ).to.be.revertedWith(
        'WrappedERC1155StewardLicenseFacet: cannot accept this token ID',
      );
    });
  });

  describe('transfer', function () {
    let instance: any;
    beforeEach(async function () {
      instance = await deployFacet();

      await mockTokenInstance
        .connect(owner)
        ['safeTransferFrom(address,address,uint256,uint256,bytes)'](
          owner.address,
          instance.address,
          1,
          1,
          '0x',
        );
    });

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
