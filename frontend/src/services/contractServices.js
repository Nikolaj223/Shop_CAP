import { ethers } from "ethers";
import {
    contractAddresses,
    contractABIs,
    EXPECTED_CHAIN_ID,
} from "../components/Utils/contract-config";

/**
 * An auxiliary function for obtaining the network ID.
 * It is important for dynamically selecting contract addresses for a specific network (for example, Sepolia).
 */
async function getChainIdFromProviderOrSigner(providerOrSigner) {
    if (!providerOrSigner) return null;
    try {
        const network = await (providerOrSigner.provider
            ? providerOrSigner.provider.getNetwork()
            : providerOrSigner.getNetwork());
        return Number(network.chainId);
    } catch (error) {
        console.error("Ошибка при получении ID сети:", error);
        return null;
    }
}

/**
 * An auxiliary function for obtaining an object with addresses for the current network.
 */
const getContractAddressesForChain = (chainId) => {
    if (!chainId) return null;
    const addresses = contractAddresses[chainId];
    if (!addresses) {
        console.warn(
            `Контракты для сети ${chainId} не найдены в конфигурации.`
        );
        return null;
    }
    return addresses;
};

// --- Functions for obtaining contract instances ---

export const getShopCAPTokenContract = (providerOrSigner) => {
    const address = contractAddresses[EXPECTED_CHAIN_ID]?.shopCAPToken;
    const abi = contractABIs.ShopCAPToken;

    if (!address) {
        throw new Error(
            `The contract address was not found for the network ${EXPECTED_CHAIN_ID}`
        );
    }

    return new ethers.Contract(address, abi, providerOrSigner);
};

export const getPartnerRegistryContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.partnerRegistry) return null;

    return new ethers.Contract(
        addresses.partnerRegistry,
        contractABIs.PartnerRegistry,
        providerOrSigner
    );
};

export const getPlatformContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.shopCAPPlatform) return null;

    return new ethers.Contract(
        addresses.shopCAPPlatform,
        contractABIs.ShopCAPPlatform,
        providerOrSigner
    );
};

export const getCashbackManagerContract = async (providerOrSigner) => {
    const chainId = await getChainIdFromProviderOrSigner(providerOrSigner);
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses?.cashbackManager) return null;

    // Using the ABI from the config, as it is now centralized
    return new ethers.Contract(
        addresses.cashbackManager,
        contractABIs.CashbackManager,
        providerOrSigner
    );
};

// --- Interaction functions (Business logic) ---

/**
 * Registering a new partner in the blockchain.
 */
export const addPartner = async (
    signer,
    partnerName,
    description,
    referralLink,
    ownerAddress
) => {
    const registry = await getPartnerRegistryContract(signer);
    if (!registry) throw new Error("Контракт PartnerRegistry не найден");

    const tx = await registry.addPartner(
        partnerName,
        description,
        referralLink,
        ownerAddress
    );

    return tx;
};

export const mintTokens = async (signer, toAddress, amount) => {
    const contract = getShopCAPTokenContract(signer);

    console.log("Calling Mint on the contract:", contract.target);

    try {
        const amountWei = ethers.parseUnits(amount.toString(), 18);
        const tx = await contract.mint(toAddress, amountWei, {
            gasLimit: 120000,
        });

        console.log("The transaction has been sent:", tx.hash);
        const receipt = await tx.wait();

        if (receipt.status === 0)
            throw new Error("The transaction was rejected by the blockchain");

        return receipt;
    } catch (error) {
        console.error("Detailed mint error:", error);

        if (error.message.includes("owner")) {
            throw new Error("Error: Only the contract owner can mint tokens.");
        }
        throw error;
    }
};

export const getShopCAPBalance = async (provider, address) => {
    try {
        const contract = getShopCAPTokenContract(provider);
        const balance = await contract.balanceOf(address);
        return ethers.formatUnits(balance, 18);
    } catch (error) {
        console.error("Error when receiving the balance:", error);
        return "0";
    }
};

export const getAllPartners = async (registryContract) => {
    if (!registryContract) {
        console.error("There is no copy of the registry contract");
        return [];
    }

    const partners = [];
    let id = 1;
    let keepGoing = true;
    const MAX_PARTNERS_LIMIT = 500;

    while (keepGoing && id <= MAX_PARTNERS_LIMIT) {
        try {
            const p = await registryContract.partners(id);

            if (!p || p.id.toString() === "0") {
                keepGoing = false;
            } else {
                partners.push({
                    id: p.id.toString(),
                    isActive: p.isActive,
                    name: p.name,
                    description: p.description,
                    referralLink: p.referralLink,
                    partnerWallet: p.partnerWallet,
                });
                id++;
            }
        } catch (error) {
            keepGoing = false;
        }
    }
    return partners;
};

export const getUserReferrerId = async (provider, userAddress) => {
    const platform = await getPlatformContract(provider);
    if (!platform) return "0";
    try {
        const refId = await platform.getUserReferrerInfo(userAddress);
        return refId.toString();
    } catch (e) {
        return "0";
    }
};

export const calculateVisualDistribution = (amount) => {
    const val = parseFloat(amount || 0);
    return {
        user: (val * 0.7).toFixed(2),
        reserve: (val * 0.2).toFixed(2),
        burn: (val * 0.1).toFixed(2),
    };
};
