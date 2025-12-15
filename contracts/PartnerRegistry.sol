// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

// ============================================================================
// 2. PartnerRegistry.sol
// Назначение: Хранит и управляет списком зарегистрированных партнеров.
// ============================================================================
contract PartnerRegistry is Ownable {
    
    struct Partner {
        uint256 id;
        bool isActive;
        string name;
        string description;
        string referralLink; // Уникальная реферальная ссылка партнера
        address partnerWallet; // Адрес кошелька партнера для получения бонусов
    }

    // Карта для хранения информации о партнерах по их ID
    mapping(uint256 => Partner) public partners;
    uint256 private _partnerIdCounter;

    // События для отслеживания изменений в реестре партнеров
    event PartnerAdded(uint256 indexed partnerId, string name, address partnerWallet);
    event PartnerUpdated(uint256 indexed partnerId, string name, address partnerWallet);
    event PartnerStatusToggled(uint256 indexed partnerId, bool isActive);

    constructor() Ownable(msg.sender) {
        // Инициализируем счетчик с 0. Первый ID будет 1.
        _partnerIdCounter = 0;
    }

    /**
     * @dev Добавляет нового партнера в реестр. Может быть вызвано только владельцем.
     * @param _name Название партнера.
     * @param _description Описание партнера.
     * @param _referralLink Реферальная ссылка партнера.
     * @param _partnerWallet Адрес кошелька партнера для начислений.
     * @return partnerId ID добавленного партнера.
     */
    function addPartner(
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner returns (uint256) {
        require(_partnerWallet != address(0), "Partner wallet cannot be zero address");
        _partnerIdCounter++;
        uint256 newPartnerId = _partnerIdCounter;

        // Проверяем, что ID не равен 0 (он всегда будет > 0 после инкрементации из 0)
        require(newPartnerId > 0, "Partner ID must be greater than 0");

        partners[newPartnerId] = Partner({
            id: newPartnerId,
            isActive: true, 
            name: _name,
            description: _description,
            referralLink: _referralLink,
            partnerWallet: _partnerWallet
        });

        emit PartnerAdded(newPartnerId, _name, _partnerWallet);
        return newPartnerId;
    }

    function updatePartner(
        uint256 _partnerId,
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external onlyOwner {
        require(_partnerWallet != address(0), "Partner wallet cannot be zero address");
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");

        Partner storage p = partners[_partnerId];
        p.name = _name;
        p.description = _description;
        p.referralLink = _referralLink;
        p.partnerWallet = _partnerWallet;

        emit PartnerUpdated(_partnerId, _name, _partnerWallet);
    }

    /**
     * @dev Изменяет статус активности партнера. Может быть вызвано только владельцем.
     * @param _partnerId ID партнера.
     * @param _isActive Новый статус активности (true для активации, false для деактивации).
     */
    function togglePartnerStatus(uint256 _partnerId, bool _isActive) external onlyOwner {
        // Проверяем, что ID существует и является действительным
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");

        // Обновляем статус активности
        partners[_partnerId].isActive = _isActive;
        emit PartnerStatusToggled(_partnerId, _isActive);
    }

    function getPartnerDetails(uint256 _partnerId)
        external
        view
        returns (bool isActive, string memory name, string memory description, string memory referralLink, address partnerWallet)
    {
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");
        Partner storage p = partners[_partnerId];
        return (p.isActive, p.name, p.description, p.referralLink, p.partnerWallet);
    }

    /**
     * @dev Возвращает адрес кошелька партнера по его ID.
     * @param _partnerId ID партнера.
     * @return Адрес кошелька партнера.
     */
    function getPartnerWallet(uint256 _partnerId) external view returns (address) {
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");
        return partners[_partnerId].partnerWallet;
    }
}
