const {
  networkConfig,
  developmentChains,
} = require('../helper-hardhat-config');
const { network } = require('hardhat');
const { verify } = require('../utils/verify');
require('dotenv').config();

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // if chainId is X user address Y
  // if chainId is Z user address A

  let ethUSDPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUSDAggregator = await deployments.get('MockV3Aggregator');
    ethUSDPriceFeedAddress = ethUSDAggregator.address;
  } else {
    ethUSDPriceFeedAddress = networkConfig[chainId]['ethUSDPriceFeed'];
  }
  // if the contract doesn't exist, we deploy a minimal version of
  // our local testing

  // well what happens when we want to change chains?
  // when going for localhost or hardhat network we wan to use a mock
  const args = [ethUSDPriceFeedAddress];
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log('----------------------------------------------------------------');
};

module.exports.tags = ['all', 'fundme'];
