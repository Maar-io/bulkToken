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
let provider;

describe('BulkToken', function () {
  beforeEach(async function () {
    [owner, bob, charlie] = await ethers.getSigners();

    BulkToken = await ethers.getContractFactory("BulkToken");
    bulkToken = await BulkToken.deploy();
    await bulkToken.deployed();
    await bulkToken.initialize();
  });

  it('retrieve version', async function () {
    await bulkToken.getVersion(); // this get will also set the version
    expect((await bulkToken.version()).toString()).to.equal('1');
  });

  it('send token to 2 addresses', async function () {
    let beneficiaries = [bob.address, charlie.address];
    let balances = [8, 2];
    expect(await bulkToken.usageCnt()).to.equal(0);

    await bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 })
    expect(await bulkToken.usageCnt()).to.equal(2);
  });

  it('send token to 2 addresses fails, bad msg.value', async function () {
    let beneficiaries = [bob.address, charlie.address];
    let balances = [8, 2];
    expect(await bulkToken.usageCnt()).to.equal(0);

    await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 9 })).to.be.revertedWith("Bad sum of all values to be transferred");
    expect(await bulkToken.usageCnt()).to.equal(0);
    await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 11 })).to.be.revertedWith("Bad sum of all values to be transferred");
  });

  it('send diff num of addresses and balances', async function () {
    let beneficiaries = [bob.address, charlie.address, owner.address];
    let balances = [8, 2];
    await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 }))
    .to.revertedWith("Different number of arrays");
    expect(await bulkToken.usageCnt()).to.equal(0);

    beneficiaries = [bob.address, charlie.address];
    balances = [8, 2, 2];
    await expect(bulkToken.connect(bob).multisendToken(beneficiaries, balances, { value: 10 }))
    .to.revertedWith("Different number of arrays");
    expect(await bulkToken.usageCnt()).to.equal(0);
  });

});