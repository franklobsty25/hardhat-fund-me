const { ethers } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { DECIMALS, INITIAL_ANSWER } = require('../../helper-hardhat-config');

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', function () {
      let fundMe;
      const sendValue = ethers.parseEther('0.01');
      beforeEach(async function () {
        const mockV3Aggregator = await ethers.deployContract(
          'MockV3Aggregator',
          [DECIMALS, INITIAL_ANSWER]
        );
        await mockV3Aggregator.waitForDeployment();

        fundMe = await ethers.deployContract('FundMe', [
          mockV3Aggregator.target,
        ]);
        fundMe.waitForDeployment();
      });

      it('Allow people to fund and withdraw', async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingBalance = await ethers.provider.getBalance(fundMe.target);
        assert.equal(endingBalance.toString(), '0');
      });
    });
