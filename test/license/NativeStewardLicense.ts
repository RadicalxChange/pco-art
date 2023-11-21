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
  let initialSteward: SignerWithAddress;
  let minter: SignerWithAddress;
  let admin: SignerWithAddress;
  let instance: any;

  before(async function () {
    [, , , , owner, nonOwner, minter, initialSteward, admin] =
      await ethers.getSigners();
  });

  async function getInstance({ shouldMint = false } = {}) {
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

    const accessControlFactory = await ethers.getContractFactory(
      'AccessControlFacet',
    );
    const accessControl = await accessControlFactory.deploy();
    await accessControl.deployed();

    const facetFactory = await ethers.getContractFactory(
      'NativeStewardLicenseMock',
    );
    const facetInstance = await facetFactory.deploy();
    await facetInstance.deployed();

    const auctionFactory = await ethers.getContractFactory(
      'EnglishPeriodicAuctionFacet',
    );
    const auctionInstance = await auctionFactory.deploy();
    await auctionInstance.deployed();

    const factory = await ethers.getContractFactory('SingleCutDiamond');
    const selectors = [
      ...Object.keys(erc721Base.interface.functions)
        .filter((v) => v !== 'supportsInterface(bytes4)')
        .map((k) => erc721Base.interface.getSighash(k)),
      ...Object.keys(erc721Metadata.interface.functions).map((k) =>
        erc721Metadata.interface.getSighash(k),
      ),
      facetFactory.interface.getSighash(
        'initializeStewardLicense(address,address,address,uint256,bool,string,string,string)',
      ),
      facetFactory.interface.getSighash('mint(address,uint256)'),
      facetFactory.interface.getSighash('burn(uint256)'),
      facetFactory.interface.getSighash('exists(uint256)'),
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
      facetFactory.interface.getSighash(
        'addTokenToCollection(address,string,uint256)',
      ),
      facetFactory.interface.getSighash(
        'addTokensToCollection(address[],string[],uint256[])',
      ),
      facetFactory.interface.getSighash(
        'addTokensToCollection(string[],uint256[],bool)',
      ),
      facetFactory.interface.getSighash(
        'addTokensWithBaseURIToCollection(uint32,uint256,uint256,string,bool)',
      ),
    ];

    const initData = facetInstance.interface.encodeFunctionData(
      'initializeStewardLicense(address,address,address,uint256,bool,string,string,string)',
      [
        await owner.getAddress(),
        await minter.getAddress(),
        await initialSteward.getAddress(),
        2,
        shouldMint,
        name,
        symbol,
        tokenURI,
      ],
    );
    let instance = await factory.connect(owner).deploy([
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
      {
        target: accessControl.address,
        initTarget: accessControl.address,
        initData: accessControl.interface.encodeFunctionData(
          'initializeAccessControl(address)',
          [admin.address],
        ),
        selectors: [
          accessControl.interface.getSighash(
            'initializeAccessControl(address)',
          ),
          accessControl.interface.getSighash('grantRole(bytes32,address)'),
          accessControl.interface.getSighash('renounceRole(bytes32)'),
          accessControl.interface.getSighash('hasRole(bytes32,address)'),
        ],
      },
      {
        target: auctionInstance.address,
        initTarget: ethers.constants.AddressZero,
        initData: '0x',
        selectors: [
          auctionFactory.interface.getSighash('auctionStartTime(uint256)'),
        ],
      },
    ]);
    await instance.deployed();

    instance = await ethers.getContractAt(
      'NativeStewardLicenseMock',
      instance.address,
    );

    if (!shouldMint) {
      await instance.mint(await owner.getAddress(), 0);
    }

    const auctionMockFacet = await ethers.getContractAt(
      'PeriodicAuctionMock',
      instance.address,
    );
    await auctionMockFacet['setIsAuctionPeriod(bool)'](false);

    return instance;
  }

  beforeEach(async function () {
    instance = await getInstance();
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
          'initializeStewardLicense(address,address,address,uint256,bool,string,string,string)'
        ](
          await owner.getAddress(),
          await minter.getAddress(),
          await initialSteward.getAddress(),
          2,
          false,
          name,
          symbol,
          tokenURI,
        ),
      ).to.be.revertedWith('StewardLicenseFacet: already initialized');
    });

    it('should set minter', async function () {
      expect(await instance.minter()).to.be.equal(await owner.getAddress());
    });

    it('should set max token count', async function () {
      expect(await instance.maxTokenCount()).to.equal(2);
    });

    it('should mint tokens', async function () {
      const mintedInstance = await getInstance({ shouldMint: true });

      expect(await mintedInstance.ownerOf(0)).to.equal(initialSteward.address);
      expect(await mintedInstance.ownerOf(1)).to.equal(initialSteward.address);
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
      expect(await instance.tokenURI(1)).to.equal(tokenURI + '1');
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

  describe('addTokenToCollection(address,string,uint256)', function () {
    it('should add token to collection', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        .addTokenToCollection(nonOwner.address, 'new-token-uri', 10);

      expect(await instance.maxTokenCount()).to.equal(3);
      expect(await instance.ownerOf(2)).to.equal(nonOwner.address);
      expect(await instance.tokenURI(2)).to.equal('new-token-uri');
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
    });

    it('should add token to collection without minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        .addTokenToCollection(
          ethers.constants.AddressZero,
          'new-token-uri',
          10,
        );

      expect(await instance.maxTokenCount()).to.equal(3);
      expect(await instance.exists(2)).to.equal(false);
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
    });

    it('should not allow add token to collection if not initial bidder', async function () {
      await expect(
        instance
          .connect(nonOwner)
          .addTokenToCollection(nonOwner.address, 'new-token-uri', 10),
      ).to.be.reverted;
    });
  });

  describe('addTokensToCollection(address[],string[],uint256[])', function () {
    it('should add tokens to collection', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        ['addTokensToCollection(address[],string[],uint256[])'](
          [nonOwner.address, owner.address],
          ['new-token-uri-1', 'new-token-uri-2'],
          [10, 11],
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.ownerOf(2)).to.equal(nonOwner.address);
      expect(await instance.ownerOf(3)).to.equal(owner.address);
      expect(await instance.tokenURI(2)).to.equal('new-token-uri-1');
      expect(await instance.tokenURI(3)).to.equal('new-token-uri-2');
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(11);
    });

    it('should add tokens to collection without minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        ['addTokensToCollection(address[],string[],uint256[])'](
          [ethers.constants.AddressZero, ethers.constants.AddressZero],
          ['new-token-uri-1', 'new-token-uri-2'],
          [10, 11],
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.exists(2)).to.equal(false);
      expect(await instance.exists(3)).to.equal(false);
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(11);
    });

    it('should not allow add tokens to collection if not initial bidder', async function () {
      await expect(
        instance
          .connect(nonOwner)
          ['addTokensToCollection(address[],string[],uint256[])'](
            [nonOwner.address, owner.address],
            ['new-token-uri-1', 'new-token-uri-2'],
            [10, 11],
          ),
      ).to.be.reverted;
    });

    it('should not allow add tokens to collection if input length mismatch', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);

      await expect(
        instance
          .connect(minter)
          ['addTokensToCollection(address[],string[],uint256[])'](
            [nonOwner.address, owner.address],
            ['new-token-uri-1'],
            [10, 11],
          ),
      ).to.be.revertedWith('StewardLicenseFacet: input array length mismatch');
    });

    it('should not allow add tokens to collection if input length mismatch', async function () {
      const auctionMockFacet = await ethers.getContractAt(
        'PeriodicAuctionMock',
        instance.address,
      );

      await auctionMockFacet.setInitialBidder(minter.address);

      await expect(
        instance
          .connect(minter)
          ['addTokensToCollection(address[],string[],uint256[])'](
            [nonOwner.address, owner.address],
            ['new-token-uri-1', 'new-token-uri-2'],
            [10],
          ),
      ).to.be.revertedWith('StewardLicenseFacet: input array length mismatch');
    });
  });

  describe('addTokensToCollection(string[],uint256[],bool)', function () {
    it('should add tokens to collection without minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        ['addTokensToCollection(string[],uint256[],bool)'](
          ['new-token-uri-1', 'new-token-uri-2'],
          [10, 11],
          false,
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.exists(2)).to.equal(false);
      expect(await instance.exists(3)).to.equal(false);
      expect(await instance.tokenURI(2)).to.equal('new-token-uri-1');
      expect(await instance.tokenURI(3)).to.equal('new-token-uri-2');
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(11);

      await instance.mint(nonOwner.address, 2);
      await instance.mint(owner.address, 3);

      expect(await instance.ownerOf(2)).to.equal(nonOwner.address);
      expect(await instance.ownerOf(3)).to.equal(owner.address);
    });

    it('should add tokens to collection with minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        ['addTokensToCollection(string[],uint256[],bool)'](
          ['new-token-uri-1', 'new-token-uri-2'],
          [10, 11],
          true,
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.exists(2)).to.equal(true);
      expect(await instance.exists(3)).to.equal(true);
      expect(await instance.tokenURI(2)).to.equal('new-token-uri-1');
      expect(await instance.tokenURI(3)).to.equal('new-token-uri-2');
      expect(await instance.ownerOf(2)).to.equal(initialSteward.address);
      expect(await instance.ownerOf(3)).to.equal(initialSteward.address);
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(11);
    });

    it('should not allow add tokens to collection if not initial bidder', async function () {
      await expect(
        instance
          .connect(nonOwner)
          ['addTokensToCollection(string[],uint256[],bool)'](
            ['new-token-uri-1', 'new-token-uri-2'],
            [10, 11],
            false,
          ),
      ).to.be.reverted;
    });
  });

  describe('addTokensWithBaseURIToCollection', function () {
    it('should add tokens to collection without minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        .addTokensWithBaseURIToCollection(
          2,
          10,
          2,
          'new-base-token-uri/',
          false,
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.exists(2)).to.equal(false);
      expect(await instance.exists(3)).to.equal(false);
      expect(await instance.exists(4)).to.equal(false);
      expect(await instance.tokenURI(2)).to.equal('new-base-token-uri/2');
      expect(await instance.tokenURI(3)).to.equal('new-base-token-uri/3');
      expect(await instance.tokenURI(1)).to.equal(tokenURI + '1');
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(12);

      await instance.mint(nonOwner.address, 2);
      await instance.mint(owner.address, 3);

      expect(await instance.ownerOf(2)).to.equal(nonOwner.address);
      expect(await instance.ownerOf(3)).to.equal(owner.address);
      expect(await instance.exists(4)).to.equal(false);
    });

    it('should add tokens to collection with minting', async function () {
      const auctionFacet = await ethers.getContractAt(
        'EnglishPeriodicAuctionFacet',
        instance.address,
      );

      await instance
        .connect(minter)
        .addTokensWithBaseURIToCollection(
          2,
          10,
          2,
          'new-base-token-uri/',
          true,
        );

      expect(await instance.maxTokenCount()).to.equal(4);
      expect(await instance.exists(2)).to.equal(true);
      expect(await instance.exists(3)).to.equal(true);
      expect(await instance.exists(4)).to.equal(false);
      expect(await instance.tokenURI(2)).to.equal('new-base-token-uri/2');
      expect(await instance.tokenURI(3)).to.equal('new-base-token-uri/3');
      expect(await instance.tokenURI(1)).to.equal(tokenURI + '1');
      expect(await instance.ownerOf(2)).to.equal(initialSteward.address);
      expect(await instance.ownerOf(3)).to.equal(initialSteward.address);
      expect(await instance.exists(4)).to.equal(false);
      expect(await auctionFacet.auctionStartTime(2)).to.equal(10);
      expect(await auctionFacet.auctionStartTime(3)).to.equal(12);
    });

    it('should not allow add tokens to collection if not initial bidder', async function () {
      await expect(
        instance
          .connect(nonOwner)
          .addTokensWithBaseURIToCollection(
            2,
            10,
            2,
            'new-base-token-uri/',
            false,
          ),
      ).to.be.reverted;
    });
  });

  describe('tokenURI', function () {
    it('should revert if token ID is beyond max', async function () {
      await expect(instance.tokenURI(3)).to.be.reverted;
    });
  });

  describe('hasRole', function () {
    it('should return true if address has add token role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(
              'StewardLicenseBase.ADD_TOKEN_TO_COLLECTION_ROLE',
            ),
          ),
          minter.address,
        ),
      ).to.be.true;
    });

    it('should return false if address does not have role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      expect(
        await accessControl.hasRole(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(
              'StewardLicenseBase.ADD_TOKEN_TO_COLLECTION_ROLE',
            ),
          ),
          nonOwner.address,
        ),
      ).to.be.false;
    });
  });

  describe('grantRole', function () {
    it('should allow admin to grant role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(admin)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes(
                'StewardLicenseBase.ADD_TOKEN_TO_COLLECTION_ROLE',
              ),
            ),
            nonOwner.address,
          ),
      ).to.not.be.reverted;
    });

    it('should only allow admin to grant role', async function () {
      const instance = await getInstance();

      const accessControl = await ethers.getContractAt(
        'AccessControlFacet',
        instance.address,
      );

      await expect(
        accessControl
          .connect(owner)
          .grantRole(
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes(
                'StewardLicenseBase.ADD_TOKEN_TO_COLLECTION_ROLE',
              ),
            ),
            nonOwner.address,
          ),
      ).to.be.reverted;
    });
  });
});
