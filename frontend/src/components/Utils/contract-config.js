// src/utils/contract-config.js
import ShopCAPTokenABI from "../../contracts/abi/ShopCAPToken.json";
import PartnerRegistryABI from "../../contracts/abi/PartnerRegistry.json";
import CashbackManagerABI from "../../contracts/abi/CashbackManager.json";
import ShopCAPPlatformABI from "../../contracts/abi/ShopCAPPlatform.json";

// Адреса контрактов для разных сетей
export const contractAddresses = {
    // Chain ID Sepolia (11155111 в десятичной системе, 0xaa36a7 в шестнадцатеричной)
    11155111: {
        shopCAPToken: "0xa2a9381f4e9196049E742A0a0BfaF030347fcE63",
        partnerRegistry: "0x1D19e5161d51098a4D95249711c6B83f044A40F7",
        cashbackManager: "0x28a19c507f6abD695725650369BE268b796135f2",
        shopCAPPlatform: "0xa0a726618cea08eD52e3cea96FAE2D6A6FC611A1",
    },
    // Добавьте другие сети по мере необходимости
    // "5": { // Goerli Testnet
    //     shopCAPToken: "0x...",
    //     partnerRegistry: "0x...",
    //     cashbackManager: "0x...",
    //     shopCAPPlatform: "0x...",
    // },
};

// ABI контрактов (независимы от сети)
export const contractABIs = {
    ShopCAPToken: ShopCAPTokenABI.abi,
    PartnerRegistry: PartnerRegistryABI.abi,
    CashbackManager: CashbackManagerABI.abi,
    ShopCAPPlatform: ShopCAPPlatformABI.abi,
};

// Ожидаемая сеть для подключения
// Используем десятичный ID, так как он часто используется в ethers.js и для сравнения
export const EXPECTED_CHAIN_ID = "11155111"; // Sepolia Testnet
export const EXPECTED_CHAIN_NAME = "Sepolia"; // Имя для отображения пользователю

// // src/components/Utils/contract-config.js

// import ShopCAPTokenABI from "../../contracts/abi/ShopCAPToken.json";
// import PartnerRegistryABI from "../../contracts/abi/PartnerRegistry.json";
// import CashbackManagerABI from "../../contracts/abi/CashbackManager.json";
// import ShopCAPPlatformABI from "../../contracts/abi/ShopCAPPlatform.json";

// export const contractAddresses = {
//     11155111: {
//         // chainId Sepolia
//         shopCAPToken: "0xa2a9381f4e9196049E742A0a0BfaF030347fcE63",
//         partnerRegistry: "0x1D19e5161d51098a4D95249711c6B83f044A40F7",
//         cashbackManager: "0x28a19c507f6abD695725650369BE268b796135f2",
//         shopCAPPlatform: "0xa0a726618cea08eD52e3cea96FAE2D6A6FC611A1",
//     },

//     // { // Goerli Testnet
//     //     shopCAPToken: "0x...",
//     //     partnerRegistry: "0x...",
//     //     cashbackManager: "0x...",
//     //     shopCAPPlatform: "0x...",
//     // },
// };

// export const contractABIs = {
//     ShopCAPToken: ShopCAPTokenABI.abi,
//     PartnerRegistry: PartnerRegistryABI.abi,
//     CashbackManager: CashbackManagerABI.abi,
//     ShopCAPPlatform: ShopCAPPlatformABI.abi,
// };

// export const EXPECTED_CHAIN_NAME = "Sepolia";
// export const EXPECTED_CHAIN_ID = "0xaa36a7";
