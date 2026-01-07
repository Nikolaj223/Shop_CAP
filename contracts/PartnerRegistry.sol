// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

// ============================================================================
// 2. PartnerRegistry.sol
// Purpose: Stores and manages a list of registered partners.
// ============================================================================
contract PartnerRegistry is Ownable {
    
    struct Partner {
        uint256 id;
        bool isActive;
        string name;
        string description;
        string referralLink; // Partner's unique referral link
        address partnerWallet; // The partner's wallet address for receiving bonuses
    }

    // A map for storing information about partners by their ID
    mapping(uint256 => Partner) public partners;
    uint256 private _partnerIdCounter;

    event PartnerAdded(uint256 indexed partnerId, string name, address partnerWallet);
    event PartnerUpdated(uint256 indexed partnerId, string name, address partnerWallet);
    event PartnerStatusToggled(uint256 indexed partnerId, bool isActive);

    constructor() Ownable(msg.sender) {   
// Initialize the counter with 0. The first ID will be 1.
        _partnerIdCounter = 0;
    }

    /**
   
* @dev Adds a new partner to the registry. Can only be called by the owner.
 * @param _name The name of the partner.
 * @param _description The description of the partner.
 * @param _referralLink The referral link of the partner.
 * @param _partnerWallet The wallet address of the partner for rewards.
 * @return partnerId The ID of the added partner.
     */
    function addPartner(
        string memory _name,
        string memory _description,
        string memory _referralLink,
        address _partnerWallet
    ) external returns (uint256) {
        require(_partnerWallet != address(0), "Partner wallet cannot be zero address");
        _partnerIdCounter++;
        uint256 newPartnerId = _partnerIdCounter;

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
    ) external {
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
    
* @dev Changes the partner's activity status. Can only be called by the owner.
 * @param _partnerId The partner's ID.
 * @param _isActive The new activity status (true for activation, false for deactivation).
 */
    function togglePartnerStatus(uint256 _partnerId, bool _isActive) external {
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");
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
 * @dev Returns the partner's wallet address by its ID.
 * @param _partnerId The partner's ID.
 * @return The partner's wallet address.
     */
    function getPartnerWallet(uint256 _partnerId) external view returns (address) {
        require(_partnerId > 0 && _partnerId <= _partnerIdCounter, "Invalid partner ID");
        return partners[_partnerId].partnerWallet;
    }
}
