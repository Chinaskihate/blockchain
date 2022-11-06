const { ethers } = require("hardhat");

require("dotenv").config();

const tokenAddress = process.env.TOKEN_ADDRESS;

const main = async () => {
  const [deployer] = await ethers.getSigners();
  console.log(`Address deploying the contract --> ${deployer.address}`);
  const tokenFactory = await ethers.getContractFactory("Game");
  const contract = await tokenFactory.deploy(tokenAddress);

  console.log(`Token Contract address --> ${contract.address}`);
};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
