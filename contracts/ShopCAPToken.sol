// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShopCAPToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    constructor() ERC20("ShopCAP", "SCAP") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    modifier canMint() {
        require(owner() == msg.sender || minters[msg.sender], "Caller is not a minter");
        _;
    }
    function setMinter(address _minter, bool _status) external onlyOwner {
        minters[_minter] = _status;
    }

    function mint(address to, uint256 amount) public canMint {
        _mint(to, amount);
    }
}