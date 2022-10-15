/**
 * @title MyToken - a simple example (ERC-20 compliant) token contract.
 */
// contract Token is // https://eips.ethereum.org/EIPS/eip-20
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../interfaces/ERC20.sol";

contract MyToken is ERC20 {
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowed;
    uint256 public totalSupply;

    string private tokenName;

    using SafeMath for uint256;

    constructor(uint256 _initialAmount, string memory _tokenName) {
        balances[msg.sender] = _initialAmount; // Give the creator all initial tokens
        totalSupply = _initialAmount; // Update total supply
        tokenName = _tokenName; // Set the name for display purposes
    }

    function name() public view returns (string memory) {
        return tokenName;
    }

    /**
     * @notice returns the total supply.
     */
    function getTotalSupply() public view returns (uint256) {
        return totalSupply;
    }

    /**
     * @param tokenOwner address to view the balance.
     */
    function balanceOf(address tokenOwner) public view returns (uint256) {
        return balances[tokenOwner];
    }

    function transfer(address _to, uint256 _value)
        public
        enoughBalance(msg.sender, _value)
        returns (bool success)
    {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        enoughBalance(_from, _value)
        enoughAllowance(_from, _value)
        returns (bool success)
    {
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        view
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    modifier enoughBalance(address _from, uint256 _value) {
        require(
            balances[_from] >= _value,
            "token balance is lower than the value requested"
        );
        _;
    }

    modifier enoughAllowance(address _from, uint256 _value) {
        require(
            allowed[_from][msg.sender] >= _value,
            "allowance is lower than the value requested"
        );
        _;
    }
}

library SafeMath {
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}
