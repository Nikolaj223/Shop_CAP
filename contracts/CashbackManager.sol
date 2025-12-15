// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ShopCAPToken.sol";
import "./PartnerRegistry.sol";

// ============================================================================
// 3. CashbackManager.sol
// Назначение: Основной контракт для всей логики, связанной с начислением кэшбэка,
// реферальных бонусов и распределения токенов (70/20/10).
// ============================================================================
contract CashbackManager is Ownable {
    // Константа, представляющая базовый адрес для "сжигания" (нулевой адрес)
    address public constant BURN_ADDRESS = address(0x000000000000000000000000000000000000dEaD); 

    ShopCAPToken public immutable shopCapToken;
    PartnerRegistry public immutable partnerRegistry;

    address public reserveWallet; // Адрес для получения доли в резервный фонд

    uint256 public userCashbackShare = 70;    // Доля пользователя
    uint256 public reserveShare = 20;         // Доля в резервный фонд
    uint256 public burnShare = 10;            // Доля на сжигание

    // Базовый процент кэшбэка от суммы покупки (например, 1 для 1%)
    uint256 public cashbackBasePercent = 1; // 1%
    // Деноминатор для процентов, чтобы работать с целыми числами (100 для процентов)
    uint256 private constant CASHBACK_PERCENT_DENOMINATOR = 100;

    // Процент реферального бонуса (например, 5 для 5%)
    // Этот процент будет вычитаться из userCashbackShare и передаваться рефереру
    uint256 public referrerBonusPercent = 0; // По умолчанию 0%

    // Карта для хранения ID партнера-реферера для каждого пользователя
    mapping(address => uint256) public userReferrerPartnerId;

    event UserRegistered(address indexed user, uint256 indexed referrerPartnerId);
    event CashbackIssued(address indexed user, uint256 indexed partnerId, uint256 purchaseAmount, uint256 userCashbackAmount);
    event ReferrerBonusIssued(address indexed referrer, uint256 indexed partnerId, uint256 bonusAmount);
    event TokensToReserve(address indexed wallet, uint256 amount);
    event TokensBurned(uint256 amount);
    event ReserveWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event CashbackParamsUpdated(uint256 newBasePercent, uint256 newUserShare, uint256 newReserveShare, uint256 newBurnShare);
    event ReferrerBonusPercentUpdated(uint256 newPercent);
    event TokenTransferred(address indexed to, uint256 amount); // Для отслеживания _withdrawAnyERC20Tokens

    /**
     * @dev Конструктор контракта CashbackManager.
     * @param _shopCapTokenAddress Адрес развернутого контракта ShopCAPToken.
     * @param _partnerRegistryAddress Адрес развернутого контракта PartnerRegistry.
     * @param _initialReserveWallet Начальный адрес кошелька для резервного фонда.
     */
    constructor(
        address _shopCapTokenAddress,
        address _partnerRegistryAddress,
        address _initialReserveWallet
    ) Ownable(msg.sender) {
        require(_shopCapTokenAddress != address(0), "ShopCAPToken address cannot be zero");
        require(_partnerRegistryAddress != address(0), "PartnerRegistry address cannot be zero");
        require(_initialReserveWallet != address(0), "Initial reserve wallet cannot be zero");

        shopCapToken = ShopCAPToken(_shopCapTokenAddress);
        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        reserveWallet = _initialReserveWallet;
    }

    /**
     * @dev Регистрирует пользователя в системе и привязывает его к партнеру-рефереру.
     * Может быть вызвана только владельцем контракта (или доверенным контрактом, например ShopCAPPlatform).
     * @param _userAddress Адрес пользователя, который регистрируется.
     * @param _referrerPartnerId ID партнера, который является реферером (0, если реферера нет).
     */
    function registerUser(address _userAddress, uint256 _referrerPartnerId) external onlyOwner {
        require(_userAddress != address(0), "User address cannot be zero");
        // Если _referrerPartnerId не 0, проверяем его существование и активность
        if (_referrerPartnerId != 0) {
            (bool isActive, , , , ) = partnerRegistry.getPartnerDetails(_referrerPartnerId);
            require(isActive, "Referrer partner is not active or does not exist");
        }
        // Записываем реферера только если он еще не зарегистрирован
        if (userReferrerPartnerId[_userAddress] == 0) {
             userReferrerPartnerId[_userAddress] = _referrerPartnerId;
             emit UserRegistered(_userAddress, _referrerPartnerId);
        }
    }

    /**
     * @dev Обрабатывает покупку, рассчитывает кэшбэк и распределяет токены.
     * Может быть вызвана только владельцем контракта (т.е. из ShopCAPPlatform).
     * @param _user Адрес пользователя, совершившего покупку.
     * @param _purchaseAmount Сумма покупки (например, в минимальных единицах валюты).
     * @param _partnerId ID партнера, через которого совершена покупка.
     */
    function issueCashbackAndDistribute(address _user, uint256 _purchaseAmount, uint256 _partnerId) external onlyOwner {
        require(_user != address(0), "User address cannot be zero");
        require(_purchaseAmount > 0, "Purchase amount must be greater than zero");
        require(_partnerId > 0, "Partner ID must be greater than zero");

        // Проверяем, существует ли партнер и активен ли он
        (bool partnerIsActive, , , , address partnerWallet) = partnerRegistry.getPartnerDetails(_partnerId);
        require(partnerIsActive, "Partner is not active or does not exist");

        // 1. Рассчитываем общую сумму кэшбэка
        // Предполагаем, что _purchaseAmount уже в правильных единицах,
        uint256 totalCashbackAmount = (_purchaseAmount * cashbackBasePercent) / CASHBACK_PERCENT_DENOMINATOR;


        // Проверяем, достаточно ли токенов на балансе контракта для выплаты
        require(shopCapToken.balanceOf(address(this)) >= totalCashbackAmount, "Insufficient ShopCAP token balance in contract");

        // 2. Распределяем общую сумму кэшбэка по долям
        uint256 userAmount = (totalCashbackAmount * userCashbackShare) / CASHBACK_PERCENT_DENOMINATOR;
        uint256 reserveAmount = (totalCashbackAmount * reserveShare) / CASHBACK_PERCENT_DENOMINATOR;
        uint256 burnAmount = (totalCashbackAmount * burnShare) / CASHBACK_PERCENT_DENOMINATOR;

        uint256 referrerAmount = 0;
        address referrerAddress = address(0);

        // 3. Обработка реферального бонуса, если есть реферер и процент бонуса > 0
        uint256 referrerPartnerId = userReferrerPartnerId[_user];
        if (referrerBonusPercent > 0 && referrerPartnerId != 0) {
            // Получаем кошелек реферера из PartnerRegistry
            (bool referrerIsActive, , , , address _referrerWallet) = partnerRegistry.getPartnerDetails(referrerPartnerId);
            if (referrerIsActive) { // Выплачиваем бонус только активному рефереру
                referrerAddress = _referrerWallet;
                referrerAmount = (userAmount * referrerBonusPercent) / CASHBACK_PERCENT_DENOMINATOR; // Бонус от части пользователя
                userAmount = userAmount - referrerAmount; // Вычитаем бонус из доли пользователя
            }
        }

        // 4. Выполняем переводы токенов
        if (userAmount > 0) {
            shopCapToken.transfer(_user, userAmount);
            emit CashbackIssued(_user, _partnerId, _purchaseAmount, userAmount);
        }

        // Рефереру (если есть)
        if (referrerAmount > 0 && referrerAddress != address(0)) {
            shopCapToken.transfer(referrerAddress, referrerAmount);
            emit ReferrerBonusIssued(referrerAddress, referrerPartnerId, referrerAmount);
        }

        // В резервный кошелек
        if (reserveAmount > 0) {
            shopCapToken.transfer(reserveWallet, reserveAmount);
            emit TokensToReserve(reserveWallet, reserveAmount);
        }

        // На сжигание 
        if (burnAmount > 0) {
            shopCapToken.transfer(BURN_ADDRESS, burnAmount);
            emit TokensBurned(burnAmount);
        }
    }

    /**
     * @dev Обновляет адрес кошелька для резервного фонда. Может быть вызвана только владельцем.
     * @param _newReserveWallet Новый адрес резервного кошелька.
     */
    function setReserveWallet(address _newReserveWallet) external onlyOwner {
        require(_newReserveWallet != address(0), "Reserve wallet cannot be zero address");
        emit ReserveWalletUpdated(reserveWallet, _newReserveWallet);
        reserveWallet = _newReserveWallet;
    }

    /**
     * @dev Обновляет параметры распределения кэшбэка и базовый процент.
     * Может быть вызвана только владельцем.
     * @param _newBasePercent Новый базовый процент кэшбэка от суммы покупки (например, 1 для 1%).
     * @param _newUserShare Новая доля пользователя (из 100%).
     * @param _newReserveShare Новая доля резервного фонда (из 100%).
     * @param _newBurnShare Новая доля на сжигание (из 100%).
     */
    function setCashbackParams(
        uint256 _newBasePercent,
        uint256 _newUserShare,
        uint256 _newReserveShare,
        uint256 _newBurnShare
    ) external onlyOwner {
        require(_newBasePercent > 0 && _newBasePercent <= CASHBACK_PERCENT_DENOMINATOR, "Invalid base cashback percent (must be > 0 and <= 100)");
        require(_newUserShare + _newReserveShare + _newBurnShare == CASHBACK_PERCENT_DENOMINATOR, "Shares must sum up to 100%");
        // Дополнительные проверки могут быть добавлены, например, что userShare не слишком мала

        cashbackBasePercent = _newBasePercent;
        userCashbackShare = _newUserShare;
        reserveShare = _newReserveShare;
        burnShare = _newBurnShare;
        emit CashbackParamsUpdated(_newBasePercent, _newUserShare, _newReserveShare, _newBurnShare);
    }

    /**
     * @dev Обновляет процент реферального бонуса. Может быть вызвана только владельцем.
     * Этот процент вычитается из доли пользователя и начисляется рефереру.
     * @param _newPercent Новый процент реферального бонуса (например, 5 для 5%).
     */
    function setReferrerBonusPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 100, "Referrer bonus percent cannot exceed 100%"); // Не может быть больше 100% от доли пользователя
        require(_newPercent <= userCashbackShare, "Referrer bonus percent cannot exceed user's share"); // Не может быть больше доли пользователя
        referrerBonusPercent = _newPercent;
        emit ReferrerBonusPercentUpdated(_newPercent);
    }

    function withdrawAnyERC20Tokens(address _tokenAddress, uint256 _amount, address _to) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        // Запрещаем выводить ShopCAPToken, чтобы не нарушать логику системы
        require(_tokenAddress != address(shopCapToken), "Cannot withdraw main ShopCAP token via this function");

        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient contract token balance for withdrawal");
        bool success = token.transfer(_to, _amount);
        require(success, "Token withdrawal failed");
        emit TokenTransferred(_to, _amount);
    }

    function getShopCapTokenBalance() external view returns (uint256) {
        return shopCapToken.balanceOf(address(this));
    }

    function getReferrerInfo(address _user) external view returns (uint256) {
        return userReferrerPartnerId[_user];
    }
}