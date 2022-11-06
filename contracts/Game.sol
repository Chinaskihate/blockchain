/**
 * @title MyToken - a simple example (ERC-20 compliant) token contract.
 */
// contract Token is // https://eips.ethereum.org/EIPS/eip-20
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libs/GameLogic.sol";
import "../libs/SafeMath.sol";
import "../interfaces/IGame.sol";

contract Game is IGame {
    using GameLogic for Move;
    using SafeMath for uint256;
    IERC20 tokenContract;

    mapping(address => mapping(address => Role)) public roles;
    mapping(address => mapping(address => uint256)) public bets;
    mapping(address => mapping(address => Move)) public moves;
    mapping(address => mapping(address => Result)) public results;

    constructor(IERC20 _tokenContract) {
        tokenContract = _tokenContract;
    }

    function startGame(address _opponentAddress)
        external
        isGameStarted(_opponentAddress)
        correctAddress(_opponentAddress)
    {
        roles[msg.sender][_opponentAddress] = Role.FirstPlayer;
        roles[_opponentAddress][msg.sender] = Role.SecondPlayer;
    }

    function getRole(address _opponentAddress)
        external
        view
        correctAddress(_opponentAddress)
        returns (Role)
    {
        return roles[msg.sender][_opponentAddress];
    }

    function bet(address _opponentAddress, uint256 _bet)
        external
        correctAddress(_opponentAddress)
        tryTransferTokenFrom(msg.sender, address(this), _bet)
    {
        bets[msg.sender][_opponentAddress] = bets[msg.sender][_opponentAddress]
            .add(_bet);
    }

    function getBetBalance(address _opponentAddress)
        external
        view
        correctAddress(_opponentAddress)
        returns (uint256)
    {
        return bets[msg.sender][_opponentAddress];
    }

    function move(address _opponentAddress, Move _move)
        external
        correctMove(_move)
        correctAddress(_opponentAddress)
        hasRole(_opponentAddress)
    {
        cleanResults(_opponentAddress);
        moves[msg.sender][_opponentAddress] = _move;
        bool isSenderFirstPlayer = roles[msg.sender][_opponentAddress] ==
            Role.FirstPlayer;
        if (isSenderFirstPlayer) {
            results[msg.sender][_opponentAddress] = moves[msg.sender][
                _opponentAddress
            ].getResult(moves[_opponentAddress][msg.sender]);
            results[_opponentAddress][msg.sender] = results[msg.sender][
                _opponentAddress
            ];
        } else {
            results[msg.sender][_opponentAddress] = moves[_opponentAddress][
                msg.sender
            ].getResult(moves[msg.sender][_opponentAddress]);
            results[_opponentAddress][msg.sender] = results[msg.sender][
                _opponentAddress
            ];
        }
        if (results[msg.sender][_opponentAddress] == Result.FirstPlayerWin) {
            if (isSenderFirstPlayer) {
                transferBet(_opponentAddress, msg.sender);
            } else {
                transferBet(msg.sender, _opponentAddress);
            }
        } else if (
            results[msg.sender][_opponentAddress] == Result.SecondPlayerWin
        ) {
            if (isSenderFirstPlayer) {
                transferBet(msg.sender, _opponentAddress);
            } else {
                transferBet(_opponentAddress, msg.sender);
            }
        }
        if (results[msg.sender][_opponentAddress] != Result.NotEnded) {
            cleanMoves(_opponentAddress);
        }
    }

    function getResult(address _opponentAddress)
        external
        view
        correctAddress(_opponentAddress)
        returns (Result)
    {
        return results[msg.sender][_opponentAddress];
    }

    function cleanMoves(address _opponentAddress) private {
        moves[msg.sender][_opponentAddress] = Move.NoMove;
        moves[_opponentAddress][msg.sender] = Move.NoMove;
    }

    function cleanResults(address _opponentAddress) private {
        results[msg.sender][_opponentAddress] = Result.NotEnded;
        results[_opponentAddress][msg.sender] = Result.NotEnded;
    }

    function withdraw(address _opponentAddress, uint256 _value)
        external
        correctAddress(_opponentAddress)
        enoughBetBalance(_opponentAddress, _value)
        tryTransferToken(msg.sender, _value)
    {
        bets[msg.sender][_opponentAddress] = bets[msg.sender][_opponentAddress]
            .sub(_value);
    }

    modifier tryTransferToken(address _to, uint256 _value) {
        _;
        require(
            tokenContract.transfer(_to, _value),
            "Error in token or contract lost your money!"
        );
    }

    function transferTokenFrom(
        address _from,
        address _to,
        uint256 _value
    ) private returns (bool) {
        return tokenContract.transferFrom(_from, _to, _value);
    }

    function transferBet(address _from, address _to)
        private
        returns (uint256 _transferedValue)
    {
        uint256 smallerBet = bets[_from][_to].min(bets[_to][_from]);
        bets[_from][_to] = bets[_from][_to].sub(smallerBet);
        bets[_to][_from] = bets[_to][_from].add(smallerBet);
        return smallerBet;
    }

    modifier tryTransferTokenFrom(
        address _from,
        address _to,
        uint256 _bet
    ) {
        try tokenContract.transferFrom(_from, _to, _bet) returns (bool res) {
            require(res);
        } catch Error(string memory reason) {
            if (
                keccak256(bytes(reason)) ==
                keccak256(
                    bytes("token balance is lower than the value requested")
                )
            ) {
                require(false, "Not enough tokens!");
            } else if (
                keccak256(bytes(reason)) ==
                keccak256(bytes("allowance is lower than the value requested"))
            ) {
                require(false, "Increase your allowance for game!");
            } else {
                require(false, "Unknown error!");
            }
        }
        _;
    }

    modifier correctMove(Move _move) {
        require(_move != Move.NoMove, "Incorrect move!");
        _;
    }

    modifier hasRole(address _opponentAddress) {
        require(
            roles[msg.sender][_opponentAddress] != Role.NoRole,
            "Somebody should start the game!"
        );
        _;
    }

    modifier enoughBetBalance(address _opponentAddress, uint256 _value) {
        require(
            bets[msg.sender][_opponentAddress] >= _value,
            "Not enough bet balance!"
        );
        _;
    }

    modifier correctAddress(address _opponentAddress) {
        require(
            msg.sender != _opponentAddress,
            "You cant play versus yourself!"
        );
        _;
    }

    modifier isGameStarted(address _opponentAddress) {
        require(
            roles[msg.sender][_opponentAddress] == Role.NoRole ||
                roles[_opponentAddress][msg.sender] == Role.NoRole,
            "Game already started!"
        );
        _;
    }
}
