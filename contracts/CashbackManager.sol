// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PartnerRegistry.sol";
import "./ShopCAPToken.sol";

contract CashbackManager {
    address public constant BURN_ADDRESS = address(0x000000000000000000000000000000000000dEaD); 

    ShopCAPToken public immutable shopCapToken;
    PartnerRegistry public immutable partnerRegistry;

    address public reserveWallet; 
    uint256 public userCashbackShare = 70;
    uint256 public reserveShare = 20;
    uint256 public burnShare = 10;
    uint256 public cashbackBasePercent = 1; 
    uint256 public referrerBonusPercent = 5; 

    mapping(address => uint256) public userReferrerPartnerId;

    constructor(
        address _shopCapTokenAddress,
        address _partnerRegistryAddress,
        address _initialReserveWallet
    ) {
        shopCapToken = ShopCAPToken(_shopCapTokenAddress);
        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        reserveWallet = _initialReserveWallet;
    }

    function registerUser(address _userAddress, uint256 _referrerPartnerId) external {
        if (_referrerPartnerId != 0) {
            (bool isActive, , , , ) = partnerRegistry.getPartnerDetails(_referrerPartnerId);
            require(isActive, "Partner not active");
        }
        userReferrerPartnerId[_userAddress] = _referrerPartnerId;
    }

    function issueCashbackAndDistribute(address _user, uint256 _purchaseAmount, uint256 _partnerId) external {
        if (_user == address(0) || _purchaseAmount == 0) return;

        uint256 totalToMint = (_purchaseAmount * cashbackBasePercent) / 100;
        if (totalToMint == 0) return;

        uint256 userAmount = (totalToMint * userCashbackShare) / 100;
        uint256 reserveAmount = (totalToMint * reserveShare) / 100;
        uint256 burnAmount = (totalToMint * burnShare) / 100;
        uint256 refPartnerId = userReferrerPartnerId[_user];
        if (referrerBonusPercent > 0 && refPartnerId != 0) {
            (bool isActive, , , , address refWallet) = partnerRegistry.getPartnerDetails(refPartnerId);
            if (isActive && refWallet != address(0)) {
                uint256 refBonus = (userAmount * referrerBonusPercent) / 100;
                userAmount -= refBonus;
                shopCapToken.mint(refWallet, refBonus);
            }
        }

        if (userAmount > 0) shopCapToken.mint(_user, userAmount);
        if (reserveAmount > 0) shopCapToken.mint(reserveWallet, reserveAmount);
        if (burnAmount > 0) shopCapToken.mint(BURN_ADDRESS, burnAmount);
    }

    function updateSettings(uint256 _base, uint256 _u, uint256 _r, uint256 _b, uint256 _ref, address _res) external {
        require(_u + _r + _b == 100, "Sum error");
        cashbackBasePercent = _base;
        userCashbackShare = _u;
        reserveShare = _r;
        burnShare = _b;
        referrerBonusPercent = _ref;
        reserveWallet = _res;
    }
}