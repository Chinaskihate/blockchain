// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

enum Move {
    NoMove,
    Rock,
    Paper,
    Scissors
}

enum Result {
    NotEnded,
    FirstPlayerWin,
    SecondPlayerWin,
    Draw
}

enum Role {
    NoRole,
    FirstPlayer,
    SecondPlayer
}

library GameLogic {
    function getResult(Move firstPlayerMove, Move secondPlayerMove)
        internal
        pure
        returns (Result _result)
    {
        if (firstPlayerMove == Move.NoMove || secondPlayerMove == Move.NoMove) {
            return Result.NotEnded;
        }
        if (firstPlayerMove == Move.Rock) {
            if (secondPlayerMove == Move.Rock) {
                return Result.Draw;
            }
            if (secondPlayerMove == Move.Paper) {
                return Result.SecondPlayerWin;
            }
            if (secondPlayerMove == Move.Scissors) {
                return Result.FirstPlayerWin;
            }
        }
        if (firstPlayerMove == Move.Paper) {
            if (secondPlayerMove == Move.Rock) {
                return Result.FirstPlayerWin;
            }
            if (secondPlayerMove == Move.Paper) {
                return Result.Draw;
            }
            if (secondPlayerMove == Move.Scissors) {
                return Result.SecondPlayerWin;
            }
        }
        if (firstPlayerMove == Move.Scissors) {
            if (secondPlayerMove == Move.Rock) {
                return Result.SecondPlayerWin;
            }
            if (secondPlayerMove == Move.Paper) {
                return Result.FirstPlayerWin;
            }
            if (secondPlayerMove == Move.Scissors) {
                return Result.Draw;
            }
        }
    }
}
