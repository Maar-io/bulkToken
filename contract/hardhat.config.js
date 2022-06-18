// require('@eth-optimism/smock/build/src/plugins/hardhat-storagelayout')
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.15",
      },
    ],
  },
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    shibuya: {
      url: 'https://evm.shibuya.astar.network',
      chainId: 81,
      accounts: [`0x${process.env.TEST_KEY}`]
    },
    shiden: {
      url: 'https://evm.shiden.astar.network',
      chainId: 336,
      accounts: [`0x${process.env.SUDO_KEY}`]
    },
    astar: {
      url: 'https://evm.astar.network',
      chainId: 592,
      accounts: [`0x${process.env.SUDO_KEY}`]
    }
  }
};