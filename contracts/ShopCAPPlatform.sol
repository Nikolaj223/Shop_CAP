// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PartnerRegistry.sol";
import "./CashbackManager.sol";

// ============================================================================
// 4. ShopCAPPlatform.sol
// Назначение: Центральная точка взаимодействия.
// Координирует вызовы между UI/другими внешними системами и внутренними контрактами.
// Отвечает за управление доступом к основным операциям.
// ============================================================================
contract ShopCAPPlatform is Ownable {
   
    PartnerRegistry public immutable partnerRegistry;
    CashbackManager public immutable cashbackManager;

    event PlatformPartnerAdded(uint256 indexed partnerId, string name, address partnerWallet);
    event PlatformPartnerUpdated(uint256 indexed partnerId, string name, address partnerWallet);
    event PlatformPartnerStatusToggled(uint256 indexed partnerId, bool isActive);
    event PlatformUserRegistered(address indexed user, uint256 indexed referrerPartnerId);
    event PlatformCashbackProcessed(address indexed user, uint256 purchaseAmount, uint256 indexed partnerId);
    event PlatformWithdrawAnyERC20Tokens(address indexed tokenAddress, address indexed to, uint256 amount);


    /**
     * @dev Конструктор контракта платформы. Устанавливает deployer'а как владельца.
     * Принимает адреса уже развернутых контрактов PartnerRegistry и CashbackManager.
     * @param _partnerRegistryAddress Адрес развернутого контракта PartnerRegistry.
     * @param _cashbackManagerAddress Адрес развернутого контракта CashbackManager.
     */
    constructor(address _partnerRegistryAddress, address _cashbackManagerAddress) Ownable(msg.sender) {
        require(_partnerRegistryAddress != address(0), "PartnerRegistry address cannot be zero");
        require(_cashbackManagerAddress != address(0), "CashbackManager address cannot be zero");

        partnerRegistry = PartnerRegistry(_partnerRegistryAddress);
        cashbackManager = CashbackManager(_cashbackManagerAddress);
        // cashbackManager.transferOwnership(address(this));
    }

    // ========================================================================
    // Функции для управления партнерами (прокси к PartnerRegistry)
    // Эти функции могут быть вызваны только владельцем ShopCAPPlatform.
    // ========================================================================

    /**
     * @dev Добавляет нового партнера. Вызывает функцию в PartnerRegistry.
     * @param _name Название партнера.
     * @param _description Описание партнера.
     * @param _referralLink Реферальная ссылка партнера.
     * @param _partnerWallet Адрес кошелька партнера.
     * @return partnerId ID добавленного партнера.
     */
    function addPartner(
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner returns (uint256) {
        uint256 partnerId = partnerRegistry.addPartner(_name, _description, _referralLink, _partnerWallet);
        emit PlatformPartnerAdded(partnerId, _name, _partnerWallet);
        return partnerId;
    }

    /**
     * @dev Обновляет информацию о существующем партнере. Вызывает функцию в PartnerRegistry.
     * @param _partnerId ID партнера для обновления.
     * @param _name Новое название партнера.
     * @param _description Новое описание партнера.
     * @param _referralLink Новая реферальная ссылка партнера.
     * @param _partnerWallet Новый адрес кошелька партнера.
     */
    function updatePartner(
        uint256 _partnerId,
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner {
        partnerRegistry.updatePartner(_partnerId, _name, _description, _referralLink, _partnerWallet);
        emit PlatformPartnerUpdated(_partnerId, _name, _partnerWallet);
    }

    /**
     * @dev Изменяет статус активности партнера. Вызывает функцию в PartnerRegistry.
     * @param _partnerId ID партнера.
     * @param _isActive Новый статус активности (true для активации, false для деактивации).
     */
    function togglePartnerStatus(uint256 _partnerId, bool _isActive) external onlyOwner {
        partnerRegistry.togglePartnerStatus(_partnerId, _isActive);
        emit PlatformPartnerStatusToggled(_partnerId, _isActive);
    }

    /**
     * @dev Возвращает полную информацию о партнере. Вызывает функцию в PartnerRegistry.
     * @param _partnerId ID партнера.
     * @return isActive Статус активности партнера.
     * @return name Название партнера.
     * @return description Описание партнера.
     * @return referralLink Реферальная ссылка партнера.
     * @return partnerWallet Адрес кошелька партнера.
     */
    function getPartnerDetails(uint256 _partnerId)
        external
        view
        returns (bool isActive, string memory name, string memory description, string memory referralLink, address partnerWallet)
    {
        return partnerRegistry.getPartnerDetails(_partnerId);
    }

    /**
     * @dev Возвращает адрес кошелька партнера по его ID. Вызывает функцию в PartnerRegistry.
     * @param _partnerId ID партнера.
     * @return Адрес кошелька партнера.
     */
    function getPartnerWallet(uint256 _partnerId) external view returns (address) {
        return partnerRegistry.getPartnerWallet(_partnerId);
    }

    // ========================================================================
    // Функции для управления пользователями и кэшбэком (прокси к CashbackManager)
    // Эти функции могут быть вызваны только владельцем ShopCAPPlatform.
    // ========================================================================

    /**
     * @dev Регистрирует нового пользователя в системе кэшбэка. Вызывает функцию в CashbackManager.
     * @param _userAddress Адрес пользователя для регистрации.
     * @param _referrerPartnerId ID партнера-реферера (0, если нет).
     */
    function registerUserOnPlatform(address _userAddress, uint256 _referrerPartnerId) external onlyOwner {
        cashbackManager.registerUser(_userAddress, _referrerPartnerId);
        emit PlatformUserRegistered(_userAddress, _referrerPartnerId);
    }

    /**
     * @dev Обрабатывает покупку и инициирует распределение кэшбэка.
     * Вызывает функцию в CashbackManager. Это основная функция для интеграции с внешним миром
     * @param _user Адрес пользователя, совершившего покупку.
     * @param _purchaseAmount Сумма покупки (в единицах, соответствующим токену ShopCAP).
     * @param _partnerId ID партнера, через которого была совершена покупка.
     */
    function processPurchaseAndIssueCashback(address _user, uint256 _purchaseAmount, uint256 _partnerId) external onlyOwner {
        cashbackManager.issueCashbackAndDistribute(_user, _purchaseAmount, _partnerId);
        emit PlatformCashbackProcessed(_user, _purchaseAmount, _partnerId);
    }

    /**
     * @dev Возвращает информацию о реферере пользователя из CashbackManager.
     * @param _user Адрес пользователя.
     * @return ID партнера-реферера.
     */
    function getUserReferrerInfo(address _user) external view returns (uint256) {
        return cashbackManager.getReferrerInfo(_user);
    }

    // ========================================================================
    // Функции для просмотра состояния и управления параметрами (прокси к CashbackManager)
    // Эти функции могут быть вызваны только владельцем ShopCAPPlatform.
    // ========================================================================

    /**
     * @dev Объявление функции для получения баланса ShopCAP токенов на контракте CashbackManager.
     */
    function getCashbackManagerShopCapBalance() external view returns (uint256) {
        return cashbackManager.getShopCapTokenBalance();
    }

    /**
     * @dev Прокси функция для обновления адреса резервного кошелька в CashbackManager.
     */
    function setCashbackManagerReserveWallet(address _newReserveWallet) external onlyOwner {
        cashbackManager.setReserveWallet(_newReserveWallet);
    }

    /**
     * @dev Прокси функция для обновления параметров кэшбэка в CashbackManager.
     */
    function setCashbackManagerParams(
        uint256 _newBasePercent,
        uint256 _newUserShare,
        uint256 _newReserveShare,
        uint256 _newBurnShare
    ) external onlyOwner {
        cashbackManager.setCashbackParams(_newBasePercent, _newUserShare, _newReserveShare, _newBurnShare);
    }

    /**
     * @dev Прокси функция для обновления процента реферального бонуса в CashbackManager.
     */
    function setCashbackManagerReferrerBonusPercent(uint256 _newPercent) external onlyOwner {
        cashbackManager.setReferrerBonusPercent(_newPercent);
    }

    // ========================================================================
    // Дополнительные служебные функции
    // ========================================================================

    /**
     * @dev Позволяет владельцу платформы вывести любые ERC20 токены,
     * не связанные с ShopCAP, если они ошибочно попали на контракт Platform.
     * Запрещает вывод ShopCAP токенов, чтобы не нарушать логику системы.
     * @param _tokenAddress Адрес токена для вывода.
     * @param _amount Количество токенов.
     * @param _to Адрес получателя.
     */
    function withdrawAnyERC20TokensFromPlatform(address _tokenAddress, uint256 _amount, address _to) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient platform token balance for withdrawal");
        bool success = token.transfer(_to, _amount);
        require(success, "Token withdrawal failed");
        emit PlatformWithdrawAnyERC20Tokens(_tokenAddress, _to, _amount);
    }

    /**
     * @dev Функция для получения текущего владельца контракта CashbackManager.
     * Может быть полезна для проверки, что ShopCAPPlatform является владельцем.
     */
    function getCashbackManagerOwner() external view returns (address) {
        return cashbackManager.owner();
    }
}