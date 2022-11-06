// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

import "../libs/GameLogic.sol";

interface IGame {
    function startGame(address _opponentAddress) external;

    function getRole(address _opponentAddress) external view returns (Role);

    function bet(address _opponentAddress, uint256 _bet) external;

    function getBetBalance(address _opponentAddress)
        external
        view
        returns (uint256);

    function move(address _opponentAddress, Move _move) external;

    function getResult(address _opponentAddress) external view returns (Result);

    function withdraw(address _opponentAddress, uint256 _value) external;
}
