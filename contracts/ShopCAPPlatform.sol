// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; 
import "./PartnerRegistry.sol";
import "./CashbackManager.sol";
import "./ShopCAPToken.sol"; 

contract ShopCAPPlatform is Ownable, ReentrancyGuard {
    PartnerRegistry public immutable partnerRegistry;
    CashbackManager public immutable cashbackManager;
    ShopCAPToken public immutable token; 

    struct Item {
        uint256 id;
        string name;
        uint256 price;
        uint256 stock;
        uint256 partnerId;
        bool isActive;
    }

    uint256 public nextItemId;
    mapping(uint256 => Item) public items;

    // 1 ETH = 10,000 SCAP
    uint256 public constant TOKENS_PER_ETH = 10000;

    event PlatformItemAdded(uint256 indexed itemId, string name, uint256 price, uint256 partnerId);
    event PlatformItemPurchased(uint256 indexed itemId, address indexed buyer, uint256 price, uint256 tokensIssued);
    event PlatformPartnerAdded(uint256 indexed partnerId, string name, address partnerWallet);

    constructor(
        address _tokenAddress,
        address _partnerRegistryAddress, 
        address _cashbackManagerAddress
    ) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Token address zero");
        token = ShopCAPToken(_tokenAddress);
        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        cashbackManager = CashbackManager(_cashbackManagerAddress);
    }
    function buyItem(uint256 _itemId) external payable nonReentrant {
        Item storage item = items[_itemId];
        require(item.isActive, "Item not active");
        require(item.stock > 0, "Out of stock");
        require(msg.value >= item.price, "Insufficient funds");

        item.stock--;

        uint256 tokensToMint = msg.value * TOKENS_PER_ETH;
        token.mint(msg.sender, tokensToMint);
        try cashbackManager.issueCashbackAndDistribute(msg.sender, msg.value, item.partnerId) {
        } catch {
        }
        if (item.partnerId == 0) {
            payable(owner()).transfer(msg.value);
        } else {
            address partnerWallet = partnerRegistry.getPartnerWallet(item.partnerId);

            if (partnerWallet != address(0)) {
                payable(partnerWallet).transfer(msg.value);
            } else {
                payable(owner()).transfer(msg.value);
            }
        }

        emit PlatformItemPurchased(_itemId, msg.sender, item.price, tokensToMint);
    }

    function listItem(string memory _name, uint256 _price, uint256 _stock, uint256 _partnerId) public {
        nextItemId++;
        items[nextItemId] = Item({
            id: nextItemId,
            name: _name,
            price: _price,
            stock: _stock,
            partnerId: _partnerId,
            isActive: true
        });
        emit PlatformItemAdded(nextItemId, _name, _price, _partnerId);
    }

    function addPartner(string memory _name, string memory _desc, string memory _link, address _wallet) public returns (uint256) {
        uint256 pId = partnerRegistry.addPartner(_name, _desc, _link, _wallet);
        emit PlatformPartnerAdded(pId, _name, _wallet);
        return pId;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
      function getAllItems() external view returns (Item[] memory) {
        Item[] memory allItems = new Item[](nextItemId);
        for (uint256 i = 1; i <= nextItemId; i++) {
            allItems[i - 1] = items[i];
        }

        return allItems;
    }
}






