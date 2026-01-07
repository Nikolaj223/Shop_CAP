import { ethers } from "ethers";
import {
    contractAddresses,
    contractABIs,
    EXPECTED_CHAIN_ID,
} from "../components/Utils/contract-config";

const getPlatformContract = (signerOrProvider) => {
    const address = contractAddresses[EXPECTED_CHAIN_ID]?.shopCAPPlatform;
    if (!address)
        throw new Error("The Platform's contract address was not found");
    return new ethers.Contract(
        address,
        contractABIs.ShopCAPPlatform,
        signerOrProvider
    );
};

const getCashbackContract = (signerOrProvider) => {
    const address = contractAddresses[EXPECTED_CHAIN_ID]?.cashbackManager;
    if (!address)
        throw new Error("The CashbackManager contract address was not found");
    return new ethers.Contract(
        address,
        contractABIs.CashbackManager,
        signerOrProvider
    );
};

export const fetchAllItems = async (providerOrSigner) => {
    try {
        const shopContract = getPlatformContract(providerOrSigner);
        const items = await shopContract.getAllItems();
        return items.map((item) => ({
            id: Number(item.id),
            name: item.name,
            price: ethers.formatEther(item.price),
            priceRaw: item.price,
            stock: Number(item.stock),
            partnerId: Number(item.partnerId),
            isActive: item.isActive,
            img: "💎",
        }));
    } catch (error) {
        console.error("mistake fetchAllItems:", error);
        return [];
    }
};

export const buyItemSimulated = async (signer, item) => {
    try {
        const cashbackContract = getCashbackContract(signer);
        const userAddress = await signer.getAddress();

        console.log(`Purchase of goods: ${item.name}. Cashback accrual...`);

        const tx = await cashbackContract.issueCashbackAndDistribute(
            userAddress,
            item.priceRaw,
            item.partnerId
        );

        const receipt = await tx.wait();
        if (receipt.status === 0)
            throw new Error("The transaction was rejected");

        const storageKey = `purchases_${userAddress.toLowerCase()}`;
        const savedPurchases = JSON.parse(
            localStorage.getItem(storageKey) || "[]"
        );

        const newPurchase = {
            id: item.id,
            name: item.name,
            price: item.price,
            img: item.img || "💎",
            purchaseDate: new Date().toLocaleString(),
            txHash: tx.hash,
        };

        localStorage.setItem(
            storageKey,
            JSON.stringify([newPurchase, ...savedPurchases])
        );
        // --------------------------------------------

        return {
            success: true,
            hash: tx.hash,
            amount: item.price,
        };
    } catch (error) {
        console.error("Purchase error:", error);
        throw error;
    }
};

export const getScapBalance = async (provider, address) => {
    try {
        const tokenAddress = contractAddresses[EXPECTED_CHAIN_ID]?.shopCAPToken;
        const scapContract = new ethers.Contract(
            tokenAddress,
            contractABIs.ShopCAPToken,
            provider
        );
        const balanceRaw = await scapContract.balanceOf(address);
        return ethers.formatUnits(balanceRaw, 18);
    } catch (error) {
        console.error("Balance error:", error);
        return "0";
    }
};

export const listItemInPlatform = async (
    signer,
    name,
    priceEth,
    stock,
    partnerId
) => {
    try {
        const shopContract = getPlatformContract(signer);
        const priceInWei = ethers.parseEther(
            priceEth.toString().replace(",", ".")
        );
        const tx = await shopContract.listItem(
            name,
            priceInWei,
            ethers.toBigInt(stock),
            ethers.toBigInt(partnerId)
        );
        return await tx.wait();
    } catch (error) {
        console.error("Mistake listItemInPlatform:", error);
        throw error;
    }
};
