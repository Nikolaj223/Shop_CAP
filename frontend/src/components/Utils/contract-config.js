import ShopCAPTokenABI from "../../contracts/abi/ShopCAPToken.json";
import PartnerRegistryABI from "../../contracts/abi/PartnerRegistry.json";
import CashbackManagerABI from "../../contracts/abi/CashbackManager.json";
import ShopCAPPlatformABI from "../../contracts/abi/ShopCAPPlatform.json";

export const contractAddresses = {
    11155111: {
        shopCAPToken: "0x16130D090F69D455068b8312040A1ACf4e8a49Ac",
        partnerRegistry: "0x7e2A36a7cc01A236f4F945Ecbed3d69Bf2F47af2",
        cashbackManager: "0xC9424D0CAdE319662E0722F58a8c82bCDB967FE7",
        shopCAPPlatform: "0xe1b3c96Ae0153879417820ff7c973aE9f97AddDc",
    },
};

export const contractABIs = {
    ShopCAPToken: ShopCAPTokenABI.abi || ShopCAPTokenABI,
    PartnerRegistry: PartnerRegistryABI.abi || PartnerRegistryABI,
    CashbackManager: CashbackManagerABI.abi || CashbackManagerABI,
    ShopCAPPlatform: ShopCAPPlatformABI.abi || ShopCAPPlatformABI,
};

export const EXPECTED_CHAIN_ID = 11155111;
export const EXPECTED_CHAIN_NAME = "Sepolia";

export default {
    contractAddresses,
    contractABIs,
    EXPECTED_CHAIN_ID,
    EXPECTED_CHAIN_NAME,
};
