// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol"; 

// ============================================================================
// 1. ShopCAPToken.sol
// Назначение: Стандартный токен стандарта ERC20 для операций кэшбэка и вознаграждений.
// ============================================================================
contract ShopCAPToken is ERC20, Ownable {
    // Константа: Начальное предложение токенов (1 миллион токенов)
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * (10**18); 

    constructor() ERC20("ShopCAP Token", "SCAP") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY); 
    }
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}