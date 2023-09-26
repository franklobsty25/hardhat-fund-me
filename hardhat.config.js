require('@nomicfoundation/hardhat-toolbox');
require('hardhat-deploy');
require('dotenv').config();
require('hardhat-gas-reporter');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: '0.8.19',
  solidity: {
    compilers: [{ version: '0.8.19' }, { version: '0.6.6' }],
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmation: 6,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currench: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: 'MATIC',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },
};
