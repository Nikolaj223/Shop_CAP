// src/services/contractServices.js
import { ethers } from "ethers"; // Импортируем ethers из 'ethers'
import {
    contractAddresses,
    contractABIs,
    // EXPECTED_CHAIN_ID, // Эти константы обычно используются на уровне контекста или UI
    // EXPECTED_CHAIN_NAME, // для валидации текущей сети, но не в сервисах контрактов
} from "../components/Utils/contract-config"; // Путь к contract-config.js

/**
 * Вспомогательная функция для получения адресов контрактов для заданной сети.
 * @param {string | number | bigint} chainId - ID текущей сети (например, '0x539' для Ganache, 11155111n для Sepolia).
 *                                            В ethers v6 chainId может быть BigInt.
 * @returns {object | null} Объект с адресами контрактов или null, если сеть не поддерживается.
 */
const getContractAddressesForChain = (chainId) => {
    let hexChainId;
    if (typeof chainId === "bigint") {
        hexChainId = `0x${chainId.toString(16)}`;
    } else if (typeof chainId === "number") {
        hexChainId = `0x${chainId.toString(16)}`;
    } else {
        hexChainId = chainId; // Предполагаем, что это уже HEX строка.
    }

    // Приводим к нижнему регистру для консистентности ключей в contractAddresses.
    const addresses = contractAddresses[hexChainId.toLowerCase()];

    if (!addresses) {
        console.warn(`Контракты не развернуты в сети с ID ${hexChainId}.`);
        return null;
    }
    return addresses;
};

/**
 * Создает экземпляр контракта ShopCAPToken.
 * @param {ethers.Signer | ethers.Provider | ethers.JsonRpcProvider} providerOrSigner - Объект провайдера или подписывающего.
 *                                                                                     Теперь можно использовать JsonRpcProvider в дополнение к Signer.
 * @param {string | number | bigint} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getShopCAPTokenContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.shopCAPToken) {
        console.error("Адрес ShopCAPToken не найден для текущей сети.");
        return null;
    }
    // В ethers v6 конструктор Contract остался прежним.
    return new ethers.Contract(
        addresses.shopCAPToken,
        contractABIs.ShopCAPToken,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта PartnerRegistry.
 * @param {ethers.Signer | ethers.Provider | ethers.JsonRpcProvider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string | number | bigint} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getPartnerRegistryContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.partnerRegistry) {
        console.error("Адрес PartnerRegistry не найден для текущей сети.");
        return null;
    }
    return new ethers.Contract(
        addresses.partnerRegistry,
        contractABIs.PartnerRegistry,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта CashbackManager.
 * @param {ethers.Signer | ethers.Provider | ethers.JsonRpcProvider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string | number | bigint} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getCashbackManagerContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.cashbackManager) {
        console.error("Адрес CashbackManager не найден для текущей сети.");
        return null;
    }
    return new ethers.Contract(
        addresses.cashbackManager,
        contractABIs.CashbackManager,
        providerOrSigner
    );
};

/**
 * Создает экземпляр контракта ShopCAPPlatform.
 * Этот контракт является основным для взаимодействия с бизнес-логикой платформы.
 * @param {ethers.Signer | ethers.Provider | ethers.JsonRpcProvider} providerOrSigner - Объект провайдера или подписывающего.
 * @param {string | number | bigint} chainId - ID текущей сети.
 * @returns {ethers.Contract | null} Экземпляр контракта или null.
 */
export const getShopCAPPlatformContract = (providerOrSigner, chainId) => {
    const addresses = getContractAddressesForChain(chainId);
    if (!addresses || !addresses.shopCAPPlatform) {
        console.error("Адрес ShopCAPPlatform не найден для текущей сети.");
        return null;
    }
    return new ethers.Contract(
        addresses.shopCAPPlatform,
        contractABIs.ShopCAPPlatform,
        providerOrSigner
    );
};

/* --- Функции для взаимодействия с контрактами --- */

/**
 * Получает баланс токенов SCAP для указанного адреса.
 * @param {ethers.Contract} tokenContract - Экземпляр контракта ShopCAPToken (должен быть создан с провайдером).
 * @param {string} userAddress - Адрес пользователя.
 * @returns {Promise<string>} Баланс токенов SCAP в читаемом формате.
 */
export const getTokenBalance = async (tokenContract, userAddress) => {
    if (!tokenContract) throw new Error("Контракт ShopCAPToken недоступен.");
    try {
        const balanceBigNumber = await tokenContract.balanceOf(userAddress);
        const decimals = await tokenContract.decimals(); // Предполагаем, что функция decimals существует
        // ethers.formatUnits используется для преобразования BigNumber в читаемый десятичный формат.
        return ethers.formatUnits(balanceBigNumber, decimals);
    } catch (error) {
        console.error(
            `Ошибка при получении баланса для ${userAddress}:`,
            error
        );
        throw error;
    }
};

/**
 * Переводит токены SCAP от текущего пользователя другому.
 * @param {ethers.Contract} tokenContract - Экземпляр контракта ShopCAPToken (должен быть создан с Signer'ом).
 * @param {string} toAddress - Адрес получателя.
 * @param {string} amount - Количество токенов для перевода (в читаемом формате, например '100.5').
 * @returns {Promise<ethers.ContractTransactionResponse>} Объект ответа транзакции.
 */
export const transferTokens = async (tokenContract, toAddress, amount) => {
    if (!tokenContract) throw new Error("Контракт ShopCAPToken недоступен.");
    try {
        const decimals = await tokenContract.decimals();
        // ethers.parseUnits используется для преобразования десятичного числа в BigInt (wei).
        const amountWei = ethers.parseUnits(amount, decimals);
        const tx = await tokenContract.transfer(toAddress, amountWei);
        // await tx.wait() теперь возвращает ethers.TransactionReceipt, что более информативно.
        await tx.wait(); // Ожидаем завершения транзакции
        console.log(`Токены успешно переведены. Хеш транзакции: ${tx.hash}`);
        return tx;
    } catch (error) {
        console.error(
            `Ошибка при переводе токенов ${amount} на ${toAddress}:`,
            error
        );
        throw error;
    }
};

/**
 * Регистрирует нового партнера через ShopCAPPlatform.
 * @param {ethers.Contract} platformContract - Экземпляр контракта ShopCAPPlatform (должен быть создан с Signer'ом).
 * @param {string} partnerName - Название партнера.
 * @param {string} description - Описание партнера.
 * @param {string} referralLink - Реферальная ссылка партнера или IPFS hash метаданных.
 * @param {string} ownerAddress - Адрес владельца (админа) партнера.
 * @returns {Promise<ethers.ContractTransactionResponse>} Объект ответа транзакции.
 */
export const registerPartner = async (
    platformContract,
    partnerName,
    description,
    referralLink,
    ownerAddress
) => {
    if (!platformContract)
        throw new Error("Контракт ShopCAPPlatform недоступен.");
    try {
        // Предполагаем, что функция `registerPartner` существует в ShopCAPPlatform
        // и принимает указанные параметры.
        const tx = await platformContract.registerPartner(
            partnerName,
            description,
            referralLink,
            ownerAddress
        );
        await tx.wait();
        console.log(
            `Партнер "${partnerName}" успешно зарегистрирован. Хеш транзакции: ${tx.hash}`
        );
        return tx;
    } catch (error) {
        console.error(
            `Ошибка при регистрации партнера "${partnerName}":`,
            error
        );
        throw error;
    }
};

/**
 * Получает детали партнера по его ID.
 * @param {ethers.Contract} platformContract - Экземпляр контракта ShopCAPPlatform (должен быть создан с провайдером).
 * @param {number|bigint} partnerId - ID партнера.
 * @returns {Promise<object>} Объект с деталями партнера.
 */
export const getPartnerDetails = async (platformContract, partnerId) => {
    if (!platformContract)
        throw new Error("Контракт ShopCAPPlatform недоступен.");
    try {
        const partner = await platformContract.getPartner(partnerId);
        // В ethers v6 BigNumber был заменен на нативный BigInt.
        // Поэтому для преобразования в строку используется .toString().
        return {
            id: partner.id.toString(), // Преобразуем BigInt к строке
            name: partner.name,
            description: partner.description,
            referralLink: partner.referralLink,
            owner: partner.owner,
            isActive: partner.isActive,
            // Добавьте другие поля по мере необходимости, убедившись, что они правильно обрабатываются.
        };
    } catch (error) {
        console.error(
            `Ошибка при получении деталей партнера с ID ${partnerId}:`,
            error
        );
        throw error;
    }
};

/**
 * Получает общее количество зарегистрированных партнеров.
 * @param {ethers.Contract} platformContract - Экземпляр контракта ShopCAPPlatform (должен быть создан с провайдером).
 * @returns {Promise<number>} Общее количество партнеров.
 */
export const getTotalPartners = async (platformContract) => {
    if (!platformContract)
        throw new Error("Контракт ShopCAPPlatform недоступен.");
    try {
        const count = await platformContract.totalPartners();
        // BigInt необходимо преобразовать в Number, если ожидается Number.
        // Будьте осторожны с очень большими числами, которые могут не поместиться в Number.
        return Number(count);
    } catch (error) {
        console.error(
            "Ошибка при получении общего количества партнеров:",
            error
        );
        throw error;
    }
};

/**
 * Чеканит токены SCAP за реферальные действия через ShopCAPPlatform.
 * Предполагается, что эта функция вызывается владельцем или авторизованным адресом.
 * @param {ethers.Contract} platformContract - Экземпляр контракта ShopCAPPlatform (должен быть создан с Signer'ом).
 * @param {string} recipientAddress - Адрес получателя токенов.
 * @param {string} amount - Количество токенов SCAP для минтинга (в читаемом формате).
 * @returns {Promise<ethers.ContractTransactionResponse>} Объект ответа транзакции.
 */
export const mintReferralTokens = async (
    // Имя функции изменено на mintReferralTokens
    platformContract,
    recipientAddress,
    amount
) => {
    if (!platformContract)
        throw new Error("Контракт ShopCAPPlatform недоступен.");
    try {
        const tokenContract = getShopCAPTokenContract(
            platformContract.runner,
            platformContract.runner.provider
                ? (await platformContract.runner.provider.getNetwork()).chainId
                : await platformContract.runner.getChainId()
        );

        if (!tokenContract) {
            throw new Error("Не удалось получить контракт токена для минта.");
        }
        const decimals = await tokenContract.decimals();
        const amountToMint = ethers.parseUnits(amount, decimals);

        // Функция mintReferralTokens, как она определена в контракте,
        // вместо гипотетической mintSCAPTokens
        const tx = await platformContract.mintReferralTokens(
            recipientAddress,
            amountToMint
        );
        await tx.wait();
        console.log(
            `Успешно сминтили ${amount} SCAP для ${recipientAddress}. Хеш транзакции: ${tx.hash}`
        );
        return tx;
    } catch (error) {
        console.error(
            `Ошибка при минтинге токенов для ${recipientAddress}:`,
            error
        );
        throw error;
    }
};

// Добавьте сюда другие функции по мере необходимости,
// например, для взаимодействия с контрактом CashbackManager (установка кэшбэка, получение кэшбэка и т.д.)

// // src/services/contractServices.js
// import { ethers } from "ethers";
// import {
//     contractAddresses,
//     contractABIs,
// } from "../components/Utils/contract-config";

// /**
//  * Вспомогательная функция для получения адресов контрактов для текущей сети.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {object|null} Объект с адресами контрактов или null, если сеть не поддерживается.
//  */
// const getContractAddressesForChain = (chainId) => {
//     const addresses = contractAddresses[chainId];
//     if (!addresses) {
//         console.error(`Контракты не развернуты в сети с ID ${chainId}`);
//         return null;
//     }
//     return addresses;
// };

// /**
//  * Создает экземпляр контракта ShopCAPToken.
//  * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {ethers.Contract | null} Экземпляр контракта или null.
//  */
// export const getShopCAPTokenContract = (providerOrSigner, chainId) => {
//     const addresses = getContractAddressesForChain(chainId);
//     if (!addresses) return null;
//     return new ethers.Contract(
//         addresses.shopCAPToken,
//         contractABIs.ShopCAPToken,
//         providerOrSigner
//     );
// };

// /**
//  * Создает экземпляр контракта PartnerRegistry.
//  * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {ethers.Contract | null} Экземпляр контракта или null.
//  */
// export const getPartnerRegistryContract = (providerOrSigner, chainId) => {
//     const addresses = getContractAddressesForChain(chainId);
//     if (!addresses) return null;
//     return new ethers.Contract(
//         addresses.partnerRegistry,
//         contractABIs.PartnerRegistry,
//         providerOrSigner
//     );
// };

// /**
//  * Создает экземпляр контракта CashbackManager.
//  * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {ethers.Contract | null} Экземпляр контракта или null.
//  */
// export const getCashbackManagerContract = (providerOrSigner, chainId) => {
//     const addresses = getContractAddressesForChain(chainId);
//     if (!addresses) return null;
//     return new ethers.Contract(
//         addresses.cashbackManager,
//         contractABIs.CashbackManager,
//         providerOrSigner
//     );
// };

// /**
//  * Создает экземпляр контракта ShopCAPPlatform.
//  * @param {ethers.Signer | ethers.Provider} providerOrSigner - Объект провайдера или подписывающего.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {ethers.Contract | null} Экземпляр контракта или null.
//  */
// export const getShopCAPPlatformContract = (providerOrSigner, chainId) => {
//     const addresses = getContractAddressesForChain(chainId);
//     if (!addresses) return null;
//     return new ethers.Contract(
//         addresses.shopCAPPlatform,
//         contractABIs.ShopCAPPlatform,
//         providerOrSigner
//     );
// };

// // --- Функции для взаимодействия с контрактами ---

// /**
//  * Получает баланс токенов пользователя.
//  * @param {ethers.Provider} provider - Объект провайдера.
//  * @param {string} tokenAddress - Адрес токена.
//  * @param {string} accountAddress - Адрес пользователя.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<string>} Баланс токенов (отформатированный).
//  */
// export const getTokenBalance = async (
//     provider,
//     tokenAddress,
//     accountAddress,
//     chainId
// ) => {
//     if (!provider || !tokenAddress || !accountAddress) return "0";
//     try {
//         const tokenContract = new ethers.Contract(
//             tokenAddress,
//             contractABIs.ShopCAPToken, // Используем ABI ShopCAPToken, так как это общий ERC20
//             provider
//         );
//         const balance = await tokenContract.balanceOf(accountAddress);
//         return ethers.utils.formatUnits(balance, 18); // Предполагаем 18 десятичных знаков
//     } catch (error) {
//         console.error("Error getting token balance:", error);
//         return "0";
//     }
// };

// /**
//  * Переводит токены.
//  * @param {ethers.Signer} signer - Объект подписывающего.
//  * @param {string} tokenAddress - Адрес токена для перевода.
//  * @param {string} toAddress - Адрес получателя.
//  * @param {string} amount - Количество токенов для перевода (в базовых единицах, если не форматируется).
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
//  */
// export const transferTokens = async (
//     signer,
//     tokenAddress,
//     toAddress,
//     amount,
//     chainId
// ) => {
//     if (!signer || !tokenAddress || !toAddress || !amount) {
//         throw new Error("Missing parameters for token transfer.");
//     }
//     try {
//         const tokenContract = new ethers.Contract(
//             tokenAddress,
//             contractABIs.ShopCAPToken,
//             signer
//         );
//         // Преобразуем сумму в ethers.BigNumber с 18 десятичными знаками
//         const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
//         const tx = await tokenContract.transfer(toAddress, amountInWei);
//         return tx;
//     } catch (error) {
//         console.error("Error transferring tokens:", error);
//         throw error;
//     }
// };

// /**
//  * Регистрирует нового партнера в PartnerRegistry.
//  * @param {ethers.Signer} signer - Объект подписывающего.
//  * @param {string} name - Имя партнера.
//  * @param {string} description - Описание партнера.
//  * @param {string} referralLink - Реферальная ссылка партнера.
//  * @param {string} ownerAddress - Адрес владельца партнера (обычно `signer.getAddress()`).
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
//  */
// export const registerPartner = async (
//     signer,
//     name,
//     description,
//     referralLink,
//     ownerAddress,
//     chainId
// ) => {
//     if (!signer) throw new Error("Signer is not available.");
//     const partnerRegistryContract = getPartnerRegistryContract(signer, chainId);
//     if (!partnerRegistryContract)
//         throw new Error("PartnerRegistry contract not found for this chain.");

//     try {
//         const tx = await partnerRegistryContract.registerPartner(
//             name,
//             description,
//             referralLink,
//             ownerAddress
//         );
//         return tx;
//     } catch (error) {
//         console.error("Error registering partner:", error);
//         throw error;
//     }
// };

// /**
//  * Получает детали партнера по его ID.
//  * @param {ethers.Provider} provider - Объект провайдера.
//  * @param {number} partnerId - ID партнера.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<object>} Детали партнера.
//  */
// export const getPartnerDetails = async (provider, partnerId, chainId) => {
//     if (!provider) throw new Error("Provider is not available.");
//     const partnerRegistryContract = getPartnerRegistryContract(
//         provider,
//         chainId
//     );
//     if (!partnerRegistryContract)
//         throw new Error("PartnerRegistry contract not found for this chain.");

//     try {
//         const details = await partnerRegistryContract.getPartner(partnerId);
//         // Преобразовать BigNumber в читаемые значения, если необходимо
//         return {
//             id: details.id.toString(),
//             ownerAddress: details.ownerAddress,
//             name: details.name,
//             description: details.description,
//             referralLink: details.referralLink,
//             isActive: details.isActive,
//             // Другие поля, если есть
//         };
//     } catch (error) {
//         console.error("Error getting partner details:", error);
//         throw error;
//     }
// };

// /**
//  * Получает общее количество зарегистрированных партнеров.
//  * @param {ethers.Provider} provider - Объект провайдера.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<number>} Общее количество партнеров.
//  */
// export const getTotalPartners = async (provider, chainId) => {
//     if (!provider) throw new Error("Provider is not available.");
//     const partnerRegistryContract = getPartnerRegistryContract(
//         provider,
//         chainId
//     );
//     if (!partnerRegistryContract)
//         throw new Error("PartnerRegistry contract not found for this chain.");

//     try {
//         const count = await partnerRegistryContract.totalPartners();
//         return count.toNumber();
//     } catch (error) {
//         console.error("Error getting total partners:", error);
//         throw error;
//     }
// };

// /**
//  * Получает все зарегистрированные партнеры.
//  * @param {ethers.Provider} provider - Объект провайдера.
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<Array<object>>} Массив с деталями всех партнеров.
//  */
// export const getAllPartners = async (provider, chainId) => {
//     if (!provider) throw new Error("Provider is not available.");
//     const partnerRegistryContract = getPartnerRegistryContract(
//         provider,
//         chainId
//     );
//     if (!partnerRegistryContract)
//         throw new Error("PartnerRegistry contract not found for this chain.");

//     try {
//         const total = await getTotalPartners(provider, chainId);
//         const partners = [];
//         for (let i = 1; i <= total; i++) {
//             // Предполагаем, что ID начинаются с 1
//             const partner = await getPartnerDetails(provider, i, chainId);
//             partners.push(partner);
//         }
//         return partners;
//     } catch (error) {
//         console.error("Error getting all partners:", error);
//         throw error;
//     }
// };

// /**
//  * Чеканит токены за реферальные действия через ShopCAPPlatform.
//  * @param {ethers.Signer} signer - Объект подписывающего.
//  * @param {string} userAddress - Адрес пользователя, для которого чеканятся токены (реферал).
//  * @param {string} referrerId - ID партнера-реферера в PartnerRegistry.
//  * @param {string} amount - Количество токенов (в базовых единицах, если не форматируется).
//  * @param {string} chainId - ID текущей сети.
//  * @returns {Promise<ethers.providers.TransactionResponse>} Ответ транзакции.
//  */
// export const mintTokensForReferral = async (
//     signer,
//     userAddress,
//     referrerId,
//     amount,
//     chainId
// ) => {
//     if (!signer) throw new Error("Signer is not available.");
//     const shopCAPPlatformContract = getShopCAPPlatformContract(signer, chainId);
//     if (!shopCAPPlatformContract)
//         throw new Error("ShopCAPPlatform contract not found for this chain.");

//     try {
//         const amountInWei = ethers.utils.parseUnits(amount.toString(), 18); // Предполагаем 18 десятичных знаков
//         const tx = await shopCAPPlatformContract.mintForReferral(
//             userAddress,
//             referrerId,
//             amountInWei
//         );
//         return tx;
//     } catch (error) {
//         console.error("Error minting tokens for referral:", error);
//         throw error;
//     }
// };

// Добавьте другие функции для взаимодействия с CashbackManager и ShopCAPPlatform
// Например, для получения кэшбэка, установки правил, инициирования выплат и т.д.
// Просто следуйте тому же паттерну: создайте контракт, вызовите метод.
