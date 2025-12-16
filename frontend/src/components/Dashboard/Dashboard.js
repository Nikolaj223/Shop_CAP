// import { ethers } from "ethers";

// // Импорт из вашего contract-config.js
// import {
//     contractAddresses,
//     contractABIs,
//     EXPECTED_CHAIN_ID,
//     EXPECTED_CHAIN_NAME,
// } from "../Utils/contract-config";

// // Глобальные переменные для удобства, чтобы не передавать их по всему коду
// let currentProvider = null;
// let currentSigner = null;
// let currentChainId = null; // Для хранения текущего Chain ID

// /**
//  * @dev Функция для подключения к Ethereum провайдеру (MetaMask) и получения Signer.
//  * Также производит проверку на соответствие ожидаемой сети.
//  * @returns {Promise<{provider: ethers.providers.Web3Provider, signer: ethers.Signer}|null>} Объект с провайдером и Signer'ом, или null в случае ошибки.
//  */
// async function connectToBlockchain() {
//     if (!window.ethereum) {
//         console.error("MetaMask не обнаружен.");
//         alert(
//             "MetaMask (или аналог Web3 провайдера) не найден. Пожалуйста, установите его."
//         );
//         return null;
//     }

//     try {
//         // Запрашиваем у пользователя разрешение на подключение к аккаунтам.
//         await window.ethereum.request({ method: "eth_requestAccounts" });

//         // Создаем провайдер ethers.js из подключенного MetaMask.
//         const provider = new ethers.providers.Web3Provider(window.ethereum);

//         // Получаем Signer (представляет собой аккаунт пользователя для подписания транзакций).
//         const signer = provider.getSigner();
//         const address = await signer.getAddress();
//         const network = await provider.getNetwork();
//         currentChainId = `0x${network.chainId.toString(16)}`; // Сохраняем и преобразуем в HEX

//         // Проверка на соответствие сети
//         if (currentChainId.toLowerCase() !== EXPECTED_CHAIN_ID.toLowerCase()) {
//             alert(
//                 `Пожалуйста, переключитесь на сеть ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}). Вы сейчас в сети ${network.name} (Chain ID: ${currentChainId}).`
//             );
//             // Если сеть не та, лучше сбросить соединение или не возвращать его
//             currentProvider = null;
//             currentSigner = null;
//             return null;
//         }

//         console.log("Подключено к MetaMask. Аккаунт:", address);
//         console.log(
//             "Подключено к сети:",
//             network.name,
//             `(Chain ID: ${currentChainId})`
//         );

//         currentProvider = provider;
//         currentSigner = signer;

//         return { provider, signer };
//     } catch (error) {
//         console.error("Ошибка при подключении к MetaMask:", error);
//         alert(
//             "Не удалось подключиться к MetaMask. Пожалуйста, убедитесь, что он установлен и вы дали разрешение."
//         );
//         currentProvider = null;
//         currentSigner = null;
//         return null;
//     }
// }

// /**
//  * @dev Вспомогательная функция для получения актуального провайдера/сигнера.
//  * Пытается переподключиться, если их нет.
//  * @param {boolean} forWrite Является ли операция записью (требует Signer) или чтением (достаточно Provider).
//  * @returns {Promise<{provider: ethers.providers.Web3Provider, signer: ethers.Signer}|null>}
//  */
// async function ensureConnection(forWrite = false) {
//     if (!currentProvider || !currentSigner) {
//         console.log("Нет активного соединения, пытаемся подключиться...");
//         return await connectToBlockchain();
//     }

//     // Дополнительная проверка Chain ID при каждом запросе
//     const network = await currentProvider.getNetwork();
//     const currentHexChainId = `0x${network.chainId.toString(16)}`;

//     if (currentHexChainId.toLowerCase() !== EXPECTED_CHAIN_ID.toLowerCase()) {
//         alert(
//             `Текущая сеть (${network.name}, ${currentHexChainId}) не соответствует ожидаемой (${EXPECTED_CHAIN_NAME}, ${EXPECTED_CHAIN_ID}). Пожалуйста, переключитесь.`
//         );
//         // Сбросим соединение, чтобы заставить пользователя переподключиться
//         currentProvider = null;
//         currentSigner = null;
//         return null;
//     }

//     if (forWrite && !currentSigner) {
//         // Вряд ли произойдет, если currentProvider есть, но на всякий
//         console.warn("Попытка записи без Signer, пытаемся переподключиться.");
//         return await connectToBlockchain();
//     }
//     return { provider: currentProvider, signer: currentSigner };
// }

// /**
//  * @dev Получает контракт ShopCAPPlatform, через который будут происходить основные взаимодействия.
//  * Для чтения данных (view) возвращает контракт с провайдером.
//  * Для отправки транзакций (write) возвращает контракт с Signer'ом.
//  * @param {boolean} forWrite Является ли операция записью (требует Signer) или чтением (достаточно Provider).
//  * @returns {Promise<ethers.Contract|null>} Экземпляр контракта ShopCAPPlatform.
//  */
// async function getPlatformContract(forWrite = false) {
//     const connection = await ensureConnection(forWrite);
//     if (!connection) return null;

//     const { provider, signer } = connection;
//     const targetSignerOrProvider = forWrite ? signer : provider;

//     // Используем chainId из contractAddresses для выбора адреса
//     const platformAddress =
//         contractAddresses[parseInt(EXPECTED_CHAIN_ID, 16)]?.shopCAPPlatform;

//     if (!platformAddress) {
//         console.error(
//             `Адрес ShopCAPPlatform не найден для Chain ID ${EXPECTED_CHAIN_ID}.`
//         );
//         return null;
//     }

//     return new ethers.Contract(
//         platformAddress,
//         contractABIs.ShopCAPPlatform, // Используем ABI из импорта
//         targetSignerOrProvider
//     );
// }

// /**
//  * @dev Получает контракт ShopCAPToken для прямых операций с токеном (например, баланс).
//  * @param {boolean} forWrite Является ли операция записью (требует Signer) или чтением (достаточно Provider).
//  * @returns {Promise<ethers.Contract|null>} Экземпляр контракта ShopCAPToken.
//  */
// async function getShopCAPTokenContract(forWrite = false) {
//     const connection = await ensureConnection(forWrite);
//     if (!connection) return null;

//     const { provider, signer } = connection;
//     const targetSignerOrProvider = forWrite ? signer : provider;

//     // Используем chainId из contractAddresses для выбора адреса
//     const tokenAddress =
//         contractAddresses[parseInt(EXPECTED_CHAIN_ID, 16)]?.shopCAPToken;

//     if (!tokenAddress) {
//         console.error(
//             `Адрес ShopCAPToken не найден для Chain ID ${EXPECTED_CHAIN_ID}.`
//         );
//         return null;
//     }

//     return new ethers.Contract(
//         tokenAddress,
//         contractABIs.ShopCAPToken, // Используем ABI из импорта
//         targetSignerOrProvider
//     );
// }

// /* ============================================================================================ */
// /* ======================== ФУНКЦИИ ВЗАИМОДЕЙСТВИЯ С КОНТРАКТАМИ =============================== */
// /* ============================================================================================ */

// /* --- Функции для ShopCAPToken --- */

// /**
//  * @dev Получает баланс токенов SCAP для указанного адреса.
//  * @param {string} address Кошелек для проверки баланса.
//  * @returns {Promise<string|null>} Отформатированный баланс SCAP или null.
//  */
// async function getSCAPBalance(address) {
//     const tokenContract = await getShopCAPTokenContract(false);
//     if (!tokenContract) return null;

//     try {
//         const balance = await tokenContract.balanceOf(address);
//         // Десятичные знаки тоже получаем из контракта для большей гибкости
//         const decimals = await (
//             await getShopCAPTokenContract(false)
//         ).decimals();
//         return ethers.utils.formatUnits(balance, decimals);
//     } catch (error) {
//         console.error("Ошибка получения баланса SCAP:", error);
//         return null;
//     }
// }

// /**
//  * @dev Минтит новые токены SCAP (только для владельца контракта ShopCAPToken).
//  * Примечание: Для выполнения этой функции кошелек должен быть владельцем ShopCAPToken.
//  * Если минтинг должен происходить через ShopCAPPlatform, то в ShopCAPPlatform должна быть
//  * соответствующая функция, вызывающая mint у ShopCAPToken, и ShopCAPPlatform должен быть
//  * APPROVER (или owner при некоторых реализациях) контракта ShopCAPToken.
//  *
//  * @param {string} toAddress Адрес получателя.
//  * @param {string} amount Количество токенов для минтинга (в базовых единицах, например, '100' для 100 токенов без учета decimals).
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function mintSCAPTokens(toAddress, amount) {
//     const tokenContract = await getShopCAPTokenContract(true); // Для записи нужен Signer
//     if (!tokenContract) return null;

//     try {
//         const decimals = await tokenContract.decimals();
//         const amountWei = ethers.utils.parseUnits(amount, decimals); // Преобразуем в wei-подобный формат

//         console.log(`Минтинг ${amount} SCAP для ${toAddress}...`);
//         const tx = await tokenContract.mint(toAddress, amountWei);
//         console.log("Транзакция минтинга отправлена:", tx.hash);
//         await tx.wait(); // Ожидаем подтверждения транзакции
//         console.log("Минтинг успешно завершен!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при минтинге SCAP токенов:", error);
//         alert(
//             "Ошибка при минтинге SCAP токенов: " +
//                 (error.data?.message || error.message)
//         ); // Более информативное сообщение об ошибке
//         return null;
//     }
// }

// /* --- Функции для ShopCAPPlatform --- */

// /**
//  * @dev Добавляет нового партнера в систему. Только владелец ShopCAPPlatform может вызвать.
//  * @param {string} name Имя партнера.
//  * @param {string} description Описание партнера.
//  * @param {string} referralLink Реферальная ссылка партнера.
//  * @param {string} partnerWallet Адрес кошелька партнера.
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function addPartner(name, description, referralLink, partnerWallet) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(`Добавление партнера: ${name}, кошелек: ${partnerWallet}`);
//         const tx = await platformContract.addPartner(
//             name,
//             description,
//             referralLink,
//             partnerWallet
//         );
//         console.log("Транзакция добавления партнера отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Партнер успешно добавлен!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при добавлении партнера:", error);
//         alert(
//             "Ошибка при добавлении партнера: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Обновляет информацию о существующем партнере. Только владелец ShopCAPPlatform может вызвать.
//  * @param {number} partnerId ID партнера.
//  * @param {string} name Имя партнера.
//  * @param {string} description Описание партнера.
//  * @param {string} referralLink Реферальная ссылка партнера.
//  * @param {string} partnerWallet Адрес кошелька партнера.
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function updatePartner(
//     partnerId,
//     name,
//     description,
//     referralLink,
//     partnerWallet
// ) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(
//             `Обновление партнера ID ${partnerId}: ${name}, кошелек: ${partnerWallet}`
//         );
//         const tx = await platformContract.updatePartner(
//             partnerId,
//             name,
//             description,
//             referralLink,
//             partnerWallet
//         );
//         console.log("Транзакция обновления партнера отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Партнер успешно обновлен!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при обновлении партнера:", error);
//         alert(
//             "Ошибка при обновлении партнера: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Переключает статус активности партнера. Только владелец ShopCAPPlatform может вызвать.
//  * @param {number} partnerId ID партнера.
//  * @param {boolean} isActive Новый статус (true - активен, false - неактивен).
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function togglePartnerStatus(partnerId, isActive) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(
//             `Переключение статуса партнера ID ${partnerId} на ${isActive}`
//         );
//         const tx = await platformContract.togglePartnerStatus(
//             partnerId,
//             isActive
//         );
//         console.log("Транзакция переключения статуса отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Статус партнера успешно обновлен!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при переключении статуса партнера:", error);
//         alert(
//             "Ошибка при переключении статуса партнера: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Получает детали о партнере по его ID.
//  * @param {number} partnerId ID партнера.
//  * @returns {Promise<object|null>} Объект с деталями партнера или null.
//  */
// async function getPartnerDetails(partnerId) {
//     const platformContract = await getPlatformContract(false);
//     if (!platformContract) return null;

//     try {
//         const details = await platformContract.getPartnerDetails(partnerId);
//         // Возвращаем объект для удобства использования
//         return {
//             isActive: details.isActive,
//             name: details.name,
//             description: details.description,
//             referralLink: details.referralLink,
//             partnerWallet: details.partnerWallet,
//         };
//     } catch (error) {
//         console.error("Ошибка при получении деталей партнера:", error);
//         return null;
//     }
// }

// /**
//  * @dev Регистрирует пользователя на платформе с указанием реферера-партнера. Только владелец ShopCAPPlatform может вызвать.
//  * @param {string} userAddress Адрес пользователя.
//  * @param {number} referrerPartnerId ID партнера-реферера (0, если нет).
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function registerUserOnPlatform(userAddress, referrerPartnerId) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(
//             `Регистрация пользователя ${userAddress} с реферером ${referrerPartnerId}`
//         );
//         const tx = await platformContract.registerUserOnPlatform(
//             userAddress,
//             referrerPartnerId
//         );
//         console.log("Транзакция регистрации пользователя отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Пользователь успешно зарегистрирован!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при регистрации пользователя:", error);
//         alert(
//             "Ошибка при регистрации пользователя: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Обрабатывает покупку и выдает кэшбэк пользователю. Только владелец ShopCAPPlatform может вызвать.
//  * @param {string} user Адрес пользователя, совершившего покупку.
//  * @param {string} purchaseAmount Сумма покупки (в базовых единицах, при необходимости с конвертацией).
//  * @param {number} partnerId ID партнера, через которого совершена покупка.
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function processPurchaseAndIssueCashback(
//     user,
//     purchaseAmount,
//     partnerId
// ) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         // Предполагаем, что purchaseAmount - это строка, и ее надо преобразовать в BigNumber
//         // Если на контракте amount принимается в wei-подобном формате, то нужна конвертация.
//         // Если amount - это просто целое число, то можно передавать так, но лучше уточнить.
//         // Для безопасности, если это сумма в фиате, и контракт ожидает ее умноженную на 10^X,
//         // то нужно сделать соответствующее преобразование.
//         // Для примера, если purchaseAmount -- это целое число в USD, и контракт ожидает USD * 10^18:
//         // const amountWei = ethers.utils.parseEther(purchaseAmount.toString());
//         const amountBN = ethers.BigNumber.from(purchaseAmount); // Если контракт ожидает просто число

//         console.log(
//             `Обработка покупки для ${user}, сумма ${purchaseAmount}, партнер ID ${partnerId}`
//         );
//         const tx = await platformContract.processPurchaseAndIssueCashback(
//             user,
//             amountBN,
//             partnerId
//         );
//         console.log("Транзакция обработки покупки отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Покупка успешно обработана, кэшбэк выдан!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при обработке покупки и выдаче кэшбэка:", error);
//         alert(
//             "Ошибка при обработке покупки и выдаче кэшбэка: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Получает информацию о реферере пользователя.
//  * @param {string} user Адрес пользователя.
//  * @returns {Promise<number|null>} ID реферера или null.
//  */
// async function getUserReferrerInfo(user) {
//     const platformContract = await getPlatformContract(false);
//     if (!platformContract) return null;

//     try {
//         const referrerId = await platformContract.getUserReferrerInfo(user);
//         return referrerId.toNumber(); // Возвращает BigNumber, конвертируем в обычное число
//     } catch (error) {
//         console.error(
//             "Ошибка при получении информации о реферере пользователя:",
//             error
//         );
//         return null;
//     }
// }

// /**
//  * @dev Получает баланс токенов ShopCAP на контракте CashbackManager.
//  * @returns {Promise<string|null>} Баланс SCAP в читаемом формате или null.
//  */
// async function getCashbackManagerSCAPBalance() {
//     const platformContract = await getPlatformContract(false); // Вызывать через платформу
//     if (!platformContract) return null;

//     try {
//         const balanceBN =
//             await platformContract.getCashbackManagerShopCapBalance();
//         const tokenContract = await getShopCAPTokenContract(false);
//         const decimals = await tokenContract.decimals();
//         return ethers.utils.formatUnits(balanceBN, decimals);
//     } catch (error) {
//         console.error("Ошибка при получении баланса CashbackManager:", error);
//         return null;
//     }
// }

// /**
//  * @dev Устанавливает параметры CashbackManager (basePercent, userShare, reserveShare, burnShare). Только владелец ShopCAPPlatform может вызвать.
//  * @param {number} basePercent Базовый процент кэшбэка (например, 100 для 1%).
//  * @param {number} userShare Доля пользователя (например, 70 для 70%).
//  * @param {number} reserveShare Доля в резерв (например, 20 для 20%).
//  * @param {number} burnShare Доля на сжигание (например, 10 для 10%).
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function setCashbackManagerParams(
//     basePercent,
//     userShare,
//     reserveShare,
//     burnShare
// ) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(
//             `Установка параметров CashbackManager: ${basePercent}, ${userShare}, ${reserveShare}, ${burnShare}`
//         );
//         const tx = await platformContract.setCashbackManagerParams(
//             basePercent,
//             userShare,
//             reserveShare,
//             burnShare
//         );
//         console.log("Транзакция установки параметров отправлена:", tx.hash);
//         await tx.wait();
//         console.log("Параметры CashbackManager успешно установлены!");
//         return tx;
//     } catch (error) {
//         console.error(
//             "Ошибка при установке параметров CashbackManager:",
//             error
//         );
//         alert(
//             "Ошибка при установке параметров CashbackManager: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// /**
//  * @dev Устанавливает процент бонуса для реферера. Только владелец ShopCAPPlatform может вызвать.
//  * @param {number} newPercent Новый процент бонуса для реферера (например, 50 для 0.5%).
//  * @returns {Promise<ethers.providers.TransactionResponse|null>} Объект транзакции или null.
//  */
// async function setCashbackManagerReferrerBonusPercent(newPercent) {
//     const platformContract = await getPlatformContract(true);
//     if (!platformContract) return null;

//     try {
//         console.log(`Установка процента бонуса реферера на ${newPercent}`);
//         const tx =
//             await platformContract.setCashbackManagerReferrerBonusPercent(
//                 newPercent
//             );
//         console.log(
//             "Транзакция установки процента бонуса отправлена:",
//             tx.hash
//         );
//         await tx.wait();
//         console.log("Процент бонуса реферера успешно установлен!");
//         return tx;
//     } catch (error) {
//         console.error("Ошибка при установке процента бонуса реферера:", error);
//         alert(
//             "Ошибка при установке процента бонуса реферера: " +
//                 (error.data?.message || error.message)
//         );
//         return null;
//     }
// }

// // =======================================================================
// // === ПРИМЕР ИСПОЛЬЗОВАНИЯ ВАШЕГО ДАШБОРДА ИЛИ ФРОНТЕНДА ===
// // =======================================================================
// // В реальном React-компоненте вы бы использовали useState и useEffect для управления состоянием и вызовами.

// async function initializeAndDisplayData() {
//     console.log("Инициализация платформы...");
//     const connection = await connectToBlockchain();
//     if (!connection) {
//         console.log("Не удалось подключиться к блокчейну.");
//         return;
//     }

//     const { signer } = connection;
//     const userAddress = await signer.getAddress();
//     console.log(`Текущий адрес пользователя: ${userAddress}`);

//     // Пример получения баланса SCAP
//     const scapBalance = await getSCAPBalance(userAddress);
//     if (scapBalance !== null) {
//         console.log(`Баланс SCAP для ${userAddress}: ${scapBalance}`);
//     }

//     // Пример получения баланса SCAP на CashbackManager
//     const cmBalance = await getCashbackManagerSCAPBalance();
//     if (cmBalance !== null) {
//         console.log(`Баланс SCAP на CashbackManager: ${cmBalance}`);
//     }

// --- Пример вызова функций (закомментировано, чтобы не вызывать случайно) ---
// Для реального использования нужно будет разкомментировать и предоставить данные

// // Добавление нового партнера
// await addPartner("Test Partner", "Описание тестового партнера", "http://testpartner.com", "0x...АдресКошелькаПартнера...");

// // Обновление партнера (предположим, ID 1)
// await updatePartner(1, "Updated Partner Name", "New Description", "http://newlink.com", "0x...НовыйАдресКошелькаПартнера...");

// // Регистрация пользователя (предположим, пользователя 0x...UserAddress... и реферера ID 1)
// await registerUserOnPlatform("0x...АдресПользователя...", 1);

// // Обработка покупки (пользователь, сумма $100, партнер ID 1)
// // Убедитесь, что '100' правильно интерпретируется контрактом (с учетом множителей на 10^18 и т.д.)
// await processPurchaseAndIssueCashback("0x...АдресПользователя...", '100', 1);

// // Получение деталей партнера
// const partnerDetails = await getPartnerDetails(1);
// if (partnerDetails) {
//     console.log("Детали партнера 1:", partnerDetails);
// }

// // Установка параметров CashbackManager
// // basePercent=100 (1%), userShare=70, reserveShare=20, burnShare=10 (сумма должна быть 100)
// // await setCashbackManagerParams(100, 70, 20, 10);

// // Установка процента бонуса реферера (например, 50 = 0.5% от кэшбэка)
// // await setCashbackManagerReferrerBonusPercent(50);
// }

// Запуск инициализации при загрузке страницы (или по клику на кнопку "Подключиться")
// initializeAndDisplayData();

// В реальном React-приложении, вы бы обернули эти функции в `useCallback` или вызывали бы их
// из обработчиков событий, а `initializeAndDisplayData` - из `useEffect`.
// Для демонстрации в виде простого JS-файла, можно вызвать так:
// window.onload = initializeAndDisplayData; // или из React-компонента
