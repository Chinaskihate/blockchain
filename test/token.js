const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken.sol", () => {
  let contractFactory;
  let contract;
  let owner;
  let alice;
  let bob;
  let initialSupply;
  let ownerAddress;
  let aliceAddress;
  let bobAddress;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    initialSupply = ethers.utils.parseEther("100000");
    contractFactory = await ethers.getContractFactory("MyToken");
    contract = await contractFactory.deploy(initialSupply, "MyToken");
    ownerAddress = await owner.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
  });

  describe("Correct setup", () => {
    it("should be named 'MyToken", async () => {
      const name = await contract.name();
      expect(name).to.equal("MyToken");
    });
    it("should have correct supply", async () => {
      const supply = await contract.getTotalSupply();
      expect(supply).to.equal(initialSupply);
    });
    it("owner should have all the supply", async () => {
      const ownerBalance = await contract.balanceOf(ownerAddress);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("Core", () => {
    it("owner should transfer to Alice and update balances", async () => {
      const transferAmount = ethers.utils.parseEther("1000");
      let aliceBalance = await contract.balanceOf(aliceAddress);
      expect(aliceBalance).to.equal(0);
      await contract.transfer(aliceAddress, transferAmount);
      aliceBalance = await contract.balanceOf(aliceAddress);
      expect(aliceBalance).to.equal(transferAmount);
    });
    it("owner should transfer to Alice and Alice to Bob", async () => {
      const transferAmount = ethers.utils.parseEther("1000");
      await contract.transfer(aliceAddress, transferAmount); // contract is connected to the owner.
      let bobBalance = await contract.balanceOf(bobAddress);
      expect(bobBalance).to.equal(0);
      await contract.connect(alice).transfer(bobAddress, transferAmount);
      bobBalance = await contract.balanceOf(bobAddress);
      aliceBalance = await contract.balanceOf(aliceAddress);
      expect(aliceBalance).to.equal(0);
      expect(bobBalance).to.equal(transferAmount);
    });
    it("owner should approve to Alice", async () => {
      const transferAmount = ethers.utils.parseEther("1000");
      await contract.approve(aliceAddress, transferAmount);
      aliceAllowance = await contract.allowance(ownerAddress, aliceAddress);
      expect(aliceAllowance).to.equal(transferAmount);
    });
    it("owner should approve to Alice and Alice transfer to Bob from owner", async () => {
      const transferAmount = ethers.utils.parseEther("1000");
      await contract.approve(aliceAddress, transferAmount);
      aliceAllowance = await contract.allowance(ownerAddress, aliceAddress);
      expect(aliceAllowance).to.equal(transferAmount);
      await contract
        .connect(alice)
        .transferFrom(ownerAddress, bobAddress, transferAmount);
      aliceAllowance = await contract.allowance(ownerAddress, aliceAddress);
      expect(aliceAllowance).to.equal(0);
      bobBalance = await contract.balanceOf(bobAddress);
      expect(bobBalance).to.equal(transferAmount);
    });
    it("should fail by depositing more than current balance", async () => {
      const txFailure = initialSupply + 1;
      await expect(
        contract.transfer(aliceAddress, txFailure)
      ).to.be.revertedWith("token balance is lower than the value requested");
    });
    it("should fail by depositing more than current allowance", async () => {
      const transferAmount = ethers.utils.parseEther("1000");
      await contract.approve(aliceAddress, transferAmount);
      await expect(
        contract
          .connect(alice)
          .transferFrom(ownerAddress, bobAddress, transferAmount + 1)
      ).to.be.revertedWith("allowance is lower than the value requested");
    });
  });
});
