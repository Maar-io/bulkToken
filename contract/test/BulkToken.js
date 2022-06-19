// test/BulkToken.js
// Load dependencies
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { constants } = require('@openzeppelin/test-helpers');

use(solidity);

let BulkToken;
let bulkToken;
let owner;
let bob;
let charlie;
let dave;
let provider;
let Nft;
let nft;

describe('BulkToken', function () {
  beforeEach(async function () {
    [owner, bob, charlie, dave] = await ethers.getSigners();

    BulkToken = await ethers.getContractFactory("BulkToken");
    bulkToken = await BulkToken.deploy();
    await bulkToken.deployed();
    await bulkToken.initialize();

    // Nft = await ethers.getContractFactory("DummyNFT");
    // nft = await Nft.deploy();
    // await nft.deployed();
    // await nft.connect(owner).setApprovalForAll(bulkToken.address, true);
  });

  describe('Native token checks', function () {

    it('Retrieve version', async function () {
      await bulkToken.getVersion(); // this get will also set the version
      expect((await bulkToken.version()).toString()).to.equal('1');
    });

    it('Send token to 2 addresses', async function () {
      let beneficiaries = [bob.address, charlie.address];
      let balances = [8, 2];
      expect(await bulkToken.usageCnt()).to.equal(0);

      await bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 })
      expect(await bulkToken.usageCnt()).to.equal(2);
    });

    it('Send token to 2 addresses fails, bad msg.value', async function () {
      let beneficiaries = [bob.address, charlie.address];
      let balances = [8, 2];
      expect(await bulkToken.usageCnt()).to.equal(0);

      await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 9 })).to.be.revertedWith("Bad sum of all values to be transferred");
      expect(await bulkToken.usageCnt()).to.equal(0);
      await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 11 })).to.be.revertedWith("Bad sum of all values to be transferred");
    });

    it('Send diff num of addresses and balances failed', async function () {
      let beneficiaries = [bob.address, charlie.address, owner.address];
      let balances = [8, 2];
      await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 }))
      .to.revertedWith("The number of beneficiaries and the number of tokens are not equal");
      expect(await bulkToken.usageCnt()).to.equal(0);

      beneficiaries = [bob.address, charlie.address];
      balances = [8, 2, 2];
      await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 }))
      .to.revertedWith("The number of beneficiaries and the number of tokens are not equal");
      expect(await bulkToken.usageCnt()).to.equal(0);
    });

    it('Send too many beneficiaries', async function () {
      let beneficiaries = [bob.address, charlie.address, owner.address];
      let balances = [8, 2, 10];
      await bulkToken.setMaxBeneficiaries(2);

      await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 20 }))
      .to.revertedWith("Too many beneficiaries");
      expect(await bulkToken.usageCnt()).to.equal(0);
    });
  });

  describe('NFT checks', function () {
    beforeEach(async function () {
      Nft = await ethers.getContractFactory("DummyNFT");
      nft = await Nft.deploy();
      await nft.deployed();
      await nft.connect(owner).setApprovalForAll(bulkToken.address, true);
    });

    it('Single NFT sent', async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
      await nft.safeMint(owner.address, 1);
      expect(await nft.balanceOf(owner.address)).to.equal(1);
      expect(await bulkToken.usageCnt()).to.equal(0);

      let beneficiaries = [bob.address];
      let tokenIds = [1];

      expect(await nft.balanceOf(bob.address)).to.equal(0);
      await bulkToken.bulkNftSend(nft.address, beneficiaries, tokenIds)
      expect(await nft.balanceOf(bob.address)).to.equal(1);
      expect(await bulkToken.usageCnt()).to.equal(1);
    });

    it('Three NFT sent', async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
      await nft.safeMint(owner.address, 1);
      await nft.safeMint(owner.address, 2);
      await nft.safeMint(owner.address, 3);
      expect(await nft.balanceOf(owner.address)).to.equal(3);
      expect(await bulkToken.usageCnt()).to.equal(0);

      let beneficiaries = [bob.address, charlie.address, dave.address];
      let tokenIds = [1,2,3];

      expect(await nft.balanceOf(bob.address)).to.equal(0);
      await bulkToken.bulkNftSend(nft.address, beneficiaries, tokenIds)
      expect(await nft.balanceOf(bob.address)).to.equal(1);
      expect(await nft.balanceOf(charlie.address)).to.equal(1);
      expect(await nft.balanceOf(dave.address)).to.equal(1);
      expect(await bulkToken.usageCnt()).to.equal(3);
    });

    it('Send diff num of addresses and nfts failed', async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
      await nft.safeMint(owner.address, 1);
      await nft.safeMint(owner.address, 2);
      await nft.safeMint(owner.address, 3);
      expect(await nft.balanceOf(owner.address)).to.equal(3);
      expect(await bulkToken.usageCnt()).to.equal(0);

      let beneficiaries = [bob.address, charlie.address, dave.address];
      let tokenIds = [1,2];

      await expect(bulkToken.bulkNftSend(nft.address, beneficiaries, tokenIds))
        .to.revertedWith("The number of beneficiaries and the number of tokens are not equal");

      expect(await bulkToken.usageCnt()).to.equal(0);
    });

    it('Send same nfts failed', async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
      await nft.safeMint(owner.address, 1);

      let beneficiaries = [bob.address, charlie.address];
      let tokenIds = [1,1];

      await expect(bulkToken.bulkNftSend(nft.address, beneficiaries, tokenIds))
        .to.revertedWith("ERC721: transfer caller is not owner nor approved");

      expect(await bulkToken.usageCnt()).to.equal(0);
    });

    it('Send too many beneficiaries', async function () {
      await nft.safeMint(owner.address, 1);
      await nft.safeMint(owner.address, 2);
      await nft.safeMint(owner.address, 3);
      let beneficiaries = [bob.address, charlie.address, dave.address];
      let tokenIds = [1,2,3];
      await bulkToken.setMaxBeneficiaries(2);

      await expect(bulkToken.bulkNftSend(nft.address, beneficiaries, tokenIds))
        .to.revertedWith("Too many beneficiaries");
    });
  });

  describe('Check common', function () {

    it('Set max_beneficiaries', async function () {
      expect((await bulkToken.max_beneficiaries())).to.equal('100');
      await bulkToken.setMaxBeneficiaries(42);
      expect((await bulkToken.max_beneficiaries())).to.equal('42');
    });


  });


});