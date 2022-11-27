// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "../libs/GameLogic.sol";
import "../interfaces/IGame.sol";

contract Player {
    IGame gameContract;

    constructor(IGame _gameContract) {
        gameContract = _gameContract;
    }

    function startGame(address _opponentAddress) external {
        gameContract.startGame(_opponentAddress);
    }
}
