import { ethers } from "ethers";
import {
    contractAddresses,
    contractABIs,
    EXPECTED_CHAIN_ID,
} from "../components/Utils/contract-config";
import { convertEthToRub } from "../utils/locale";

const DEMO_ITEMS_STORAGE_KEY = "shopcap.demo.marketplace.items";
const DEMO_BALANCES_STORAGE_KEY = "shopcap.demo.marketplace.balances";
const DEFAULT_DEMO_USER_KEY = "guest";

const getPlatformContract = (signerOrProvider) => {
    const address = contractAddresses[EXPECTED_CHAIN_ID]?.shopCAPPlatform;

    if (!address) {
        throw new Error("Адрес контракта платформы не найден.");
    }

    return new ethers.Contract(
        address,
        contractABIs.ShopCAPPlatform,
        signerOrProvider
    );
};

const getCashbackContract = (signerOrProvider) => {
    const address = contractAddresses[EXPECTED_CHAIN_ID]?.cashbackManager;

    if (!address) {
        throw new Error("Адрес контракта CashbackManager не найден.");
    }

    return new ethers.Contract(
        address,
        contractABIs.CashbackManager,
        signerOrProvider
    );
};

function readStorageJson(storageKey, fallbackValue) {
    try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
        return fallbackValue;
    }
}

function writeStorageJson(storageKey, value) {
    localStorage.setItem(storageKey, JSON.stringify(value));
}

function normalizeUserKey(userKey) {
    const normalized = String(userKey || DEFAULT_DEMO_USER_KEY).trim();
    return normalized ? normalized.toLowerCase() : DEFAULT_DEMO_USER_KEY;
}

function getPurchaseStorageKey(userKey) {
    return `purchases_${normalizeUserKey(userKey)}`;
}

function readDemoItems() {
    const items = readStorageJson(DEMO_ITEMS_STORAGE_KEY, []);
    return Array.isArray(items) ? items : [];
}

function writeDemoItems(items) {
    writeStorageJson(DEMO_ITEMS_STORAGE_KEY, items);
}

function readDemoBalances() {
    const balances = readStorageJson(DEMO_BALANCES_STORAGE_KEY, {});
    return balances && typeof balances === "object" ? balances : {};
}

function writeDemoBalances(balances) {
    writeStorageJson(DEMO_BALANCES_STORAGE_KEY, balances);
}

function calculateDemoReward(priceEth, ethRubRate) {
    const rubValue = convertEthToRub(priceEth, ethRubRate);

    if (rubValue === null || Number.isNaN(rubValue)) {
        return 1;
    }

    return Math.max(Number((rubValue * 0.007).toFixed(2)), 1);
}

function normalizeDemoItem(item) {
    return {
        id: item.id,
        name: item.name,
        price: String(item.price),
        priceRaw: item.priceRaw || null,
        priceRub: item.priceRub || null,
        stock: Number(item.stock || 100),
        partnerId: Number(item.partnerId || 0),
        isActive: item.isActive !== false,
        img: item.img || "RM",
        isDemo: true,
        categoryLabel: "Demo local",
        createdAt: item.createdAt || new Date().toISOString(),
    };
}

export const fetchAllItems = async (providerOrSigner) => {
    let blockchainItems = [];

    if (providerOrSigner) {
        try {
            const shopContract = getPlatformContract(providerOrSigner);
            const items = await shopContract.getAllItems();

            blockchainItems = items.map((item) => ({
                id: Number(item.id),
                name: item.name,
                price: ethers.formatEther(item.price),
                priceRaw: item.price,
                stock: Number(item.stock),
                partnerId: Number(item.partnerId),
                isActive: item.isActive,
                img: "RM",
                isDemo: false,
                categoryLabel: "Демо-товар",
            }));
        } catch (error) {
            console.error("Ошибка загрузки товаров:", error);
        }
    }

    const demoItems = readDemoItems().map(normalizeDemoItem);

    return [...demoItems, ...blockchainItems];
};

export const buyItemSimulated = async (signer, item) => {
    try {
        const cashbackContract = getCashbackContract(signer);
        const userAddress = await signer.getAddress();

        console.log(
            `Покупка товара: ${item.name}. Начисление кешбека...`
        );

        const tx = await cashbackContract.issueCashbackAndDistribute(
            userAddress,
            item.priceRaw,
            item.partnerId
        );

        const receipt = await tx.wait();

        if (receipt.status === 0) {
            throw new Error("Транзакция была отклонена сетью.");
        }

        return {
            success: true,
            hash: tx.hash,
            amount: item.price,
            mode: "blockchain",
        };
    } catch (error) {
        console.error("Ошибка покупки:", error);
        throw error;
    }
};

export const buyItemDemo = async ({ item, userKey, ethRubRate }) => {
    const normalizedUserKey = normalizeUserKey(userKey);
    const storageKey = getPurchaseStorageKey(normalizedUserKey);
    const currentPurchases = readStorageJson(storageKey, []);
    const rewardScap = calculateDemoReward(item.price, ethRubRate);
    const balances = readDemoBalances();
    const currentBalance = Number(balances[normalizedUserKey] || 0);
    const purchase = {
        id: item.id,
        name: item.name,
        price: item.price,
        priceRaw: item.priceRaw || null,
        img: item.img || "RM",
        purchaseDate: new Date().toISOString(),
        status: "Demo кешбек начислен",
        mode: "demo",
        rewardScap,
    };

    localStorage.setItem(
        storageKey,
        JSON.stringify([...currentPurchases, purchase])
    );

    balances[normalizedUserKey] = Number((currentBalance + rewardScap).toFixed(2));
    writeDemoBalances(balances);

    return {
        success: true,
        amount: item.price,
        rewardScap,
        mode: "demo",
    };
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
        console.error("Ошибка получения баланса:", error);
        return "0";
    }
};

export const getDemoScapBalance = (userKey) => {
    const balances = readDemoBalances();
    const normalizedUserKey = normalizeUserKey(userKey);
    return String(balances[normalizedUserKey] || 0);
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
        console.error("Ошибка добавления товара:", error);
        throw error;
    }
};

export const listDemoItem = async ({
    name,
    partnerId = 0,
    priceEth,
    priceRub,
    stock = 100,
}) => {
    const newItem = normalizeDemoItem({
        id: `demo_${Date.now()}`,
        name,
        price: priceEth,
        priceRub: priceRub ? Number(priceRub) : null,
        stock,
        partnerId,
        isActive: true,
        img: "RM",
        createdAt: new Date().toISOString(),
    });
    const existingItems = readDemoItems();

    existingItems.unshift(newItem);
    writeDemoItems(existingItems);

    return newItem;
};

export { DEFAULT_DEMO_USER_KEY, getPurchaseStorageKey };
