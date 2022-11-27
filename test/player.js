const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const Role = {
  NoRole: 0,
  FirstPlayer: 1,
  SecondPlayer: 2,
};

describe("Player.sol", () => {
  let game;
  let alice;
  let aliceAddress;
  let player;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();

    const tokenFactory = await ethers.getContractFactory("MyToken");
    initialSupply = ethers.utils.parseEther("100000");
    const myToken = await tokenFactory.deploy(initialSupply, "MyToken");

    const gameFactory = await ethers.getContractFactory("Game");
    game = await gameFactory.deploy(myToken.address);

    const playerFactory = await ethers.getContractFactory("Player");
    player = await playerFactory.deploy(game.address);
  });

  describe("startGame", () => {
    it("player should start and give correct roles", async () => {
      await player.startGame(aliceAddress);
      let playerRole = await game.connect(player.address).getRole(aliceAddress);
      let aliceRole = await game.connect(aliceAddress).getRole(player.address);
      expect(playerRole).to.equal(Role.FirstPlayer);
      expect(aliceRole).to.equal(Role.SecondPlayer);
    });
  });
});
