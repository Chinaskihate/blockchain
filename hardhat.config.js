require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

require("dotenv").config();

const privateKey = process.env.WALLET_PRIVATE_KEY;
const endpoint = process.env.URL;
const apiKey = process.env.API_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.8",
  networks: {
    goerli: {
      url: `${endpoint}${apiKey}`,
      accounts: [privateKey]
    }
  }
}