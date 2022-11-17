require("dotenv").config();
const Web3 = require("web3");
const fs = require("fs");

const endpoint = process.env.INFURA_URL;
const apiKey = process.env.API_KEY;
const walletAddress = process.env.WALLET_ADDRESS;
const tokenAddress = process.env.WEB3_TOKEN_ADDRESS;
const url = endpoint + apiKey;

const abi = JSON.parse(
  fs.readFileSync("artifacts/contracts/MyToken.sol/MyToken.json")
).abi;

var web3 = new Web3(new Web3.providers.HttpProvider(url));

web3.eth.getBlockNumber().then((result) => {
  console.log("Latest Ethereum Block is ", result);
});

web3.eth.getBalance(walletAddress).then((result) => {
  console.log("Balance is: ", result);
});

const myContract = new web3.eth.Contract(abi, tokenAddress);
myContract.methods
  .name()
  .call()
  .then((result) => {
    console.log(result);
  });
