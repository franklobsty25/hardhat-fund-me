const { assert, expect } = require('chai');
const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { DECIMALS, INITIAL_ANSWER } = require('../../helper-hardhat-config');
const { developmentChains } = require('../../helper-hardhat-config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.parseEther('1');
      beforeEach(async function () {
        // deploy our fundMe contract
        // using Hardhat-deploy
        /**
         * Alternative way of getting accounts
         * const accounts = await ethers.getSigners()
         * const accountZero = accounts[0]
         */
        const accounts = await ethers.getSigners();
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture('all');
        // mockV3Aggregator = await deployments.deploy('MockV3Aggregator', {
        //   contract: 'MockV3Aggregator',
        //   from: deployer,
        //   log: true,
        //   args: [DECIMALS, INITIAL_ANSWER],
        // });
        mockV3Aggregator = await ethers.deployContract('MockV3Aggregator', [
          DECIMALS,
          INITIAL_ANSWER,
        ]);
        await mockV3Aggregator.waitForDeployment();

        fundMe = await ethers.deployContract('FundMe', [
          mockV3Aggregator.target,
        ]);
        await fundMe.waitForDeployment();
        // fundMe = await deployments.deploy('FundMe', {
        //   contract: 'FundMe',
        //   from: deployer,
        //   log: true,
        //   args: [mockV3Aggregator.address],
        // });
      });

      describe('constructor', function () {
        it('sets the aggregator addresses correctly', async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.target);
        });
      });

      describe('fund', function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            'You need to spend more ETH!'
          );
        });

        it('Update the amount funded data structure', async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it('Adds funder to array of funders', async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe('Withdrwa', async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it('Withdraw ETH from a single founder', async function () {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });

        it('Allows us to withdraw with multiple funders', async function () {
          // Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it('Only allows the owner to withdraw', async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.reverted;
        });

        it('CheaperWithdraw testing...', async function () {
          // Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );

          // Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
