const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { deployMockContract, provider } = waffle;

const Role = {
  NoRole: 0,
  FirstPlayer: 1,
  SecondPlayer: 2,
};

const Move = {
  NoMove: 0,
  Rock: 1,
  Paper: 2,
  Scissors: 3,
};

const Result = {
  NotEnded: 0,
  FirstPlayerWin: 1,
  SecondPlayerWin: 2,
  Draw: 3,
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

describe("Game.sol", () => {
  let game;
  let mockedMyToken;
  let alice;
  let aliceAddress;
  let bob;
  let bobAddress;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const [deployerOfContract] = provider.getWallets();
    const MyToken = require("../artifacts/contracts/MyToken.sol/MyToken.json");
    mockedMyToken = await deployMockContract(deployerOfContract, MyToken.abi);

    const gameFactory = await ethers.getContractFactory("Game");
    game = await gameFactory.deploy(mockedMyToken.address);
  });

  describe("startGame", () => {
    it("game should start and give correct roles", async () => {
      await game.connect(alice).startGame(bobAddress);
      let aliceRole = await game.connect(alice).getRole(bobAddress);
      let bobRole = await game.connect(bob).getRole(aliceAddress);
      expect(aliceRole).to.equal(Role.FirstPlayer);
      expect(bobRole).to.equal(Role.SecondPlayer);
    });
    it("no roles if game is not started", async () => {
      let aliceRole = await game.connect(alice).getRole(bobAddress);
      let bobRole = await game.connect(bob).getRole(aliceAddress);
      expect(aliceRole).to.equal(Role.NoRole);
      expect(bobRole).to.equal(Role.NoRole);
    });
    it("should fail by starting already started game", async () => {
      await game.connect(alice).startGame(bobAddress);
      await expect(
        game.connect(alice).startGame(bobAddress)
      ).to.be.revertedWith("Game already started!");
      await expect(
        game.connect(bob).startGame(aliceAddress)
      ).to.be.revertedWith("Game already started!");
    });
    it("should fail by starting vs yourself", async () => {
      await expect(
        game.connect(alice).startGame(aliceAddress)
      ).to.be.revertedWith("You cant play versus yourself!");
    });
  });

  describe("bet", () => {
    it("game should correctly change bets balance", async () => {
      await game.connect(alice).startGame(bobAddress);
      let bet = 100;
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, bet)
        .returns(true);
      await game.connect(alice).bet(bobAddress, bet);
      let actualBet = await game.connect(alice).getBetBalance(bobAddress);
      expect(actualBet).to.equal(actualBet);
    });
    it("should fail by tokens contract require", async () => {
      await game.connect(alice).startGame(bobAddress);
      let bet = 100;

      await mockedMyToken.mock.transferFrom.revertsWithReason(
        "token balance is lower than the value requested"
      );
      await expect(game.connect(alice).bet(bobAddress, bet)).to.be.revertedWith(
        "Not enough tokens!"
      );

      await mockedMyToken.mock.transferFrom.revertsWithReason(
        "allowance is lower than the value requested"
      );
      await expect(game.connect(alice).bet(bobAddress, bet)).to.be.revertedWith(
        "Increase your allowance for game!"
      );

      await mockedMyToken.mock.transferFrom.revertsWithReason("some error");
      await expect(game.connect(alice).bet(bobAddress, bet)).to.be.revertedWith(
        "Unknown error!"
      );
    });
    it("should fail by betting vs yourself", async () => {
      await game.connect(alice).startGame(bobAddress);
      let bet = 100;
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, bet)
        .returns(true);
      await expect(
        game.connect(alice).bet(aliceAddress, bet)
      ).to.be.revertedWith("You cant play versus yourself!");
    });
  });

  describe("move", () => {
    describe("rock,paper,scissors logic", () => {
      it("works correctly if first player didn't move", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(bob).move(aliceAddress, Move.Rock);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.NotEnded);
        expect(actualResultBob).to.equal(Result.NotEnded);
      });
      it("works correctly if second player didn't move", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Rock);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.NotEnded);
        expect(actualResultBob).to.equal(Result.NotEnded);
      });
      it("works correctly rock vs rock", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Rock);
        await game.connect(bob).move(aliceAddress, Move.Rock);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.Draw);
        expect(actualResultBob).to.equal(Result.Draw);
      });
      it("works correctly rock vs paper", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Rock);
        await game.connect(bob).move(aliceAddress, Move.Paper);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.SecondPlayerWin);
        expect(actualResultBob).to.equal(Result.SecondPlayerWin);
      });
      it("works correctly rock vs scissors", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Rock);
        await game.connect(bob).move(aliceAddress, Move.Scissors);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.FirstPlayerWin);
        expect(actualResultBob).to.equal(Result.FirstPlayerWin);
      });
      it("works correctly paper vs rock", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Paper);
        await game.connect(bob).move(aliceAddress, Move.Rock);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.FirstPlayerWin);
        expect(actualResultBob).to.equal(Result.FirstPlayerWin);
      });
      it("works correctly paper vs paper", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Paper);
        await game.connect(bob).move(aliceAddress, Move.Paper);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.Draw);
        expect(actualResultBob).to.equal(Result.Draw);
      });
      it("works correctly paper vs scissors", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Paper);
        await game.connect(bob).move(aliceAddress, Move.Scissors);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.SecondPlayerWin);
        expect(actualResultBob).to.equal(Result.SecondPlayerWin);
      });
      it("works correctly scissors vs rock", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Scissors);
        await game.connect(bob).move(aliceAddress, Move.Rock);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.SecondPlayerWin);
        expect(actualResultBob).to.equal(Result.SecondPlayerWin);
      });
      it("works correctly scissors vs paper", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Scissors);
        await game.connect(bob).move(aliceAddress, Move.Paper);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.FirstPlayerWin);
        expect(actualResultBob).to.equal(Result.FirstPlayerWin);
      });
      it("works correctly scissors vs scissors", async () => {
        await game.connect(alice).startGame(bobAddress);
        await game.connect(alice).move(bobAddress, Move.Scissors);
        await game.connect(bob).move(aliceAddress, Move.Scissors);
        let actualResultAlice = await game.connect(alice).getResult(bobAddress);
        let actualResultBob = await game.connect(bob).getResult(aliceAddress);
        expect(actualResultAlice).to.equal(Result.Draw);
        expect(actualResultBob).to.equal(Result.Draw);
      });
    });
    it("transfers bet to winner", async () => {
      await game.connect(alice).startGame(bobAddress);
      let aliceBet = getRandomInt(100, 1000);
      let bobBet = getRandomInt(100, 1000);
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, aliceBet)
        .returns(true);
      await mockedMyToken.mock.transferFrom
        .withArgs(bobAddress, game.address, bobBet)
        .returns(true);
      await game.connect(alice).bet(bobAddress, aliceBet);
      await game.connect(bob).bet(aliceAddress, bobBet);

      await game.connect(alice).move(bobAddress, Move.Paper);
      await game.connect(bob).move(aliceAddress, Move.Rock);

      let actualAliceBalance = await game
        .connect(alice)
        .getBetBalance(bobAddress);
      let actualBobBalance = await game
        .connect(bob)
        .getBetBalance(aliceAddress);
      expect(actualAliceBalance).to.equal(
        aliceBet + Math.min(aliceBet, bobBet)
      );
      expect(actualBobBalance).to.equal(bobBet - Math.min(aliceBet, bobBet));
    });
    it("should fail by not started game", async () => {
      await expect(
        game.connect(alice).move(bobAddress, Move.Paper)
      ).to.be.revertedWith("Somebody should start the game!");
    });
    it("should fail by incorrect move", async () => {
      await game.connect(alice).startGame(bobAddress);
      await expect(
        game.connect(alice).move(bobAddress, Move.NoMove)
      ).to.be.revertedWith("Incorrect move!");
    });
    it("should fail by moving vs yourself", async () => {
      await game.connect(alice).startGame(bobAddress);
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, 0)
        .returns(true);
      await expect(game.connect(alice).bet(aliceAddress, 0)).to.be.revertedWith(
        "You cant play versus yourself!"
      );
    });
  });

  describe("withdraw", () => {
    // two tests because can't get invokation list of mock
    it("transfers bet to tokens decreases bet balance", async () => {
      await game.connect(alice).startGame(bobAddress);
      let aliceBet = getRandomInt(100, 1000);
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, aliceBet)
        .returns(true);
      await mockedMyToken.mock.transfer
        .withArgs(aliceAddress, aliceBet)
        .returns(true);

      await game.connect(alice).bet(bobAddress, aliceBet);
      await game.connect(alice).withdraw(bobAddress, aliceBet);

      let actualAliceBalance = await game
        .connect(alice)
        .getBetBalance(bobAddress);
      expect(actualAliceBalance).to.equal(0);
    });
    it("transfers bet to tokens invokes token contract", async () => {
      await game.connect(alice).startGame(bobAddress);
      let aliceBet = getRandomInt(100, 1000);
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transferFrom
        .withArgs(aliceAddress, game.address, aliceBet)
        .returns(true);
      await mockedMyToken.mock.transfer
        .withArgs(aliceAddress, aliceBet)
        .revertsWithReason("invoked");

      await game.connect(alice).bet(bobAddress, aliceBet);
      await expect(
        game.connect(alice).withdraw(bobAddress, aliceBet)
      ).to.be.revertedWith("invoked");
    });
    it("should fail by withdraw vs yourself", async () => {
      await game.connect(alice).startGame(bobAddress);
      await mockedMyToken.mock.transferFrom.reverts();
      await mockedMyToken.mock.transfer.withArgs(aliceAddress, 0).returns(true);

      await expect(
        game.connect(alice).withdraw(aliceAddress, 0)
      ).to.be.revertedWith("You cant play versus yourself!");
    });
  });
});
