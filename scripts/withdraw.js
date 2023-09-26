const { ethers } = require('hardhat');
const { DECIMALS, INITIAL_ANSWER } = require('../helper-hardhat-config');

async function main() {
  const mockV3Aggregator = await ethers.deployContract('MockV3Aggregator', [
    DECIMALS,
    INITIAL_ANSWER,
  ]);
  await mockV3Aggregator.waitForDeployment();

  const fundMe = await ethers.deployContract('FundMe', [
    mockV3Aggregator.target,
  ]);
  fundMe.waitForDeployment();

  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);

  console.log('=====Withdrawal!=========');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
