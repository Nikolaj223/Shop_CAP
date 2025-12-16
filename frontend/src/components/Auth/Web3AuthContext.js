// src/components/Auth/Web3AuthContext.js
import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    useContext,
} from "react";
// В ethers.js v6, BrowserProvider используется для работы с провайдерами браузера (например, MetaMask).
// ethers.providers.Web3Provider больше не существует.
import { ethers, BrowserProvider } from "ethers";
import {
    EXPECTED_CHAIN_ID,
    EXPECTED_CHAIN_NAME,
} from "../Utils/contract-config";
// Импортируем все функции из contractServices, которые будут использовать новые типы ethers.js v6.
import * as ContractServices from "../../services/contractServices";

// Создаем контекст для авторизации через Web3.
// Экспортируем его, чтобы компоненты могли использовать useContext(AuthContext).
export const AuthContext = createContext(null);

// Хук для удобного использования контекста AuthContext.
// Позволяет компонентам получить доступ к данным авторизации без прямого импорта AuthContext.
export const useWeb3Auth = () => {
    const context = useContext(AuthContext);
    // Проверяем, что хук используется внутри AuthProvider, чтобы избежать ошибок.
    if (context === undefined) {
        throw new Error("useWeb3Auth must be used within an AuthProvider");
    }
    return context;
};

// Функция для подключения к MetaMask и получения данных провайдера/подписанта.
const connectWeb3Internal = async () => {
    // Проверяем наличие глобального объекта window.ethereum, который предоставляет MetaMask.
    if (!window.ethereum) {
        throw new Error("MetaMask (или другой Web3-провайдер) не обнаружен.");
    }

    // Создаем экземпляр BrowserProvider из window.ethereum.
    // Это аналог ethers.providers.Web3Provider из v5.
    const ethereumProvider = new BrowserProvider(window.ethereum);

    // Запрашиваем аккаунты у пользователя.
    // `BrowserProvider` имеет метод `send`, совместимый с JSON-RPC.
    const accounts = await ethereumProvider.send("eth_requestAccounts", []);
    if (accounts.length === 0) {
        throw new Error("Не подключены аккаунты MetaMask.");
    }
    const currentAccount = accounts[0]; // Берем первый аккаунт.

    // Получаем подписанта (Signer) для отправки транзакций.
    // В ethers.js v6 `getSigner()` является асинхронной функцией.
    const ethSigner = await ethereumProvider.getSigner(currentAccount);

    // Получаем информацию о текущей сети.
    const currentNetwork = await ethereumProvider.getNetwork();

    // Проверяем, соответствует ли текущая сеть ожидаемой.
    // Сравниваем chainId, преобразовывая оба в строку для надежности.
    if (currentNetwork.chainId.toString() !== EXPECTED_CHAIN_ID.toString()) {
        // Если сеть не соответствует, пытаемся переключить ее.
        await switchNetwork(EXPECTED_CHAIN_ID);
        // После успешного переключения MetaMask отправит событие 'chainChanged',
        // которое вызовет повторную инициализацию через useEffect.
        // Поэтому выбрасываем ошибку, чтобы остановить текущий поток и дождаться переинициализации.
        throw new Error(
            `Пожалуйста, переключитесь на сеть ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}). Вы сейчас на ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId}).`
        );
    }

    // Возвращаем объекты провайдера, подписанта, текущего аккаунта и сети.
    return {
        provider: ethereumProvider,
        signer: ethSigner,
        account: currentAccount,
        network: currentNetwork,
    };
};

// Функция для переключения сети в MetaMask.
const switchNetwork = async (chainId) => {
    // MetaMask ожидает chainId в шестнадцатеричном формате.
    const hexChainId = `0x${parseInt(chainId, 10).toString(16)}`;
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
        });
    } catch (error) {
        // Код ошибки 4902 означает, что сеть не добавлена в MetaMask.
        if (error.code === 4902) {
            console.warn(
                `Сеть ${EXPECTED_CHAIN_NAME} (ID: ${chainId}) не добавлена в MetaMask. Попробуйте добавить вручную или используйте "wallet_addEthereumChain".`
            );
            // Можно предложить добавить сеть, используя method "wallet_addEthereumChain"
            // например: await addNetwork(chainId, networkName, rpcUrl, currencySymbol, explorerUrl);
            throw new Error(
                `Сеть ${EXPECTED_CHAIN_NAME} не найдена в вашем MetaMask. Пожалуйста, добавьте ее вручную или переключитесь.`
            );
        } else {
            // Пользователь отклонил запрос или произошла другая ошибка.
            throw new Error(
                `Ошибка при переключении сети: ${error.message || error}`
            );
        }
    }
};

// Функция для подписки на события MetaMask (accountsChanged, chainChanged).
// Эти события критичны для поддержания актуального состояния Web3 в приложении.
const subscribeToWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", onAccountsChanged);
        // В v6 chainChanged возвращает Hex-строку, поэтому передаем ее как есть.
        window.ethereum.on("chainChanged", onChainChanged);
    }
};

// Функция для отписки от событий MetaMask, чтобы избежать утечек памяти.
const unsubscribeFromWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", onAccountsChanged);
        window.ethereum.removeListener("chainChanged", onChainChanged);
    }
};

// Компонент-провайдер контекста Web3.
// Он оборачивает остальную часть приложения и предоставляет ей доступ к состоянию Web3.
export const AuthProvider = ({ children }) => {
    // Состояния для хранения информации о подключении к Web3.
    const [account, setAccount] = useState(null); // Текущий адрес аккаунта.
    const [provider, setProvider] = useState(null); // Экземпляр провайдера ethers.
    const [signer, setSigner] = useState(null); // Экземпляр подписанта ethers.
    const [network, setNetwork] = useState(null); // Информация о текущей сети.
    const [loading, setLoading] = useState(true); // Состояние загрузки.
    const [error, setError] = useState(null); // Состояние ошибок.

    // Функция для инициализации Web3. Используется useCallback для предотвращения
    // ненужных перерендеров и для использования в useEffect.
    const initWeb3 = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const {
                provider: ethProvider,
                signer: ethSigner,
                account: acc,
                network: net,
            } = await connectWeb3Internal(); // Пытаемся подключиться к Web3.

            // Обновляем состояние после успешного подключения.
            setAccount(acc);
            setProvider(ethProvider);
            setSigner(ethSigner);
            setNetwork(net);
        } catch (err) {
            console.error("Ошибка инициализации Web3:", err);
            // Если произошла ошибка, сбрасываем состояние и устанавливаем ошибку.
            setError(err.message || "Не удалось подключиться к Web3.");
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setNetwork(null);
        } finally {
            setLoading(false); // Загрузка завершена (успешно или с ошибкой).
        }
    }, []); // Пустой массив зависимостей означает, что функция создается один раз.

    // useEffect для управления жизненным циклом подключения и событий.
    useEffect(() => {
        // Инициируем подключение сразу при монтировании компонента.
        initWeb3();

        // Обработчик изменения аккаунтов.
        const handleAccountsChanged = (newAccounts) => {
            if (newAccounts.length > 0) {
                console.log("Аккаунт изменен. Новый аккаунт:", newAccounts[0]);
                initWeb3(); // Переинициализируем Web3, чтобы обновить состояние.
            } else {
                // Если аккаунтов нет, значит, пользователь отключил кошелек или все аккаунты.
                console.log("Кошелек отключен.");
                setAccount(null);
                setProvider(null);
                setSigner(null);
                setNetwork(null);
                setError("MetaMask отключен или аккаунты не выбраны.");
            }
        };

        // Обработчик изменения сети.
        const handleChainChanged = (chainIdHex) => {
            console.log("Сеть изменена на:", chainIdHex);
            initWeb3(); // Переинициализируем Web3, чтобы обновить состояние и проверить соответствие сети.
        };

        // Подписываемся на события MetaMask.
        subscribeToWeb3Events(handleAccountsChanged, handleChainChanged);

        // Функция очистки, выполняется при размонтировании компонента.
        // Отписываемся от событий, чтобы предотвратить утечки памяти.
        return () => {
            unsubscribeFromWeb3Events(
                handleAccountsChanged,
                handleChainChanged
            );
        };
    }, [initWeb3]); // Зависимость от initWeb3, чтобы она была актуальной.

    // Объект значений, предоставляемый контекстом.
    const contextValue = {
        account,
        provider,
        signer,
        network,
        loading,
        error,
        connectWallet: initWeb3, // Предоставляем функцию для ручного переподключения.
    };

    // Рендерим провайдер контекста, передавая ему вычисленные значения.
    // Дочерние компоненты, обернутые в <AuthProvider>, смогут получить эти значения.
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
// // src/components/Auth/Web3AuthContext.js
// import React, {
//     createContext,
//     useState,
//     useEffect,
//     useCallback,
//     useContext,
// } from "react";
// import { ethers } from "ethers";
// import {
//     EXPECTED_CHAIN_ID,
//     EXPECTED_CHAIN_NAME,
// } from "../Utils/contract-config";
// import * as ContractServices from "../../services/contractServices"; // Импортируем все функции из contractServices

// // Создаем контекст для Web3
// const AuthContext = createContext(null);

// // Хук для более удобного использования контекста
// export const useWeb3Auth = () => {
//     const context = useContext(AuthContext);
//     if (context === undefined) {
//         throw new Error("useWeb3Auth must be used within a Web3AuthProvajder");
//     }
//     return context;
// };

// // Функция для подключения к MetaMask и получения провайдера/подписанта
// const connectWeb3Internal = async () => {
//     if (!window.ethereum) {
//         throw new Error("MetaMask (или другой Web3-провайдер) не обнаружен.");
//     }

//     // Создаем провайдера ethers из window.ethereum
//     const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);

//     // Запрашиваем аккаунты пользователя
//     const accounts = await ethereumProvider.send("eth_requestAccounts", []);
//     if (accounts.length === 0) {
//         throw new Error("Не подключены аккаунты MetaMask.");
//     }
//     const currentAccount = accounts[0];

//     const ethSigner = ethereumProvider.getSigner(currentAccount);
//     const currentNetwork = await ethereumProvider.getNetwork();

//     // Проверяем, соответствует ли текущая сеть ожидаемой
//     // currentNetwork.chainId может быть числом, а EXPECTED_CHAIN_ID - строкой, преобразуем для сравнения
//     if (currentNetwork.chainId.toString() !== EXPECTED_CHAIN_ID.toString()) {
//         // Попытка переключиться на ожидаемую сеть
//         await switchNetwork(EXPECTED_CHAIN_ID);
//         // Если switchNetwork успешен, MetaMask отправит 'chainChanged', что вызовет повторную инициализацию
//         // В противном случае, будет выброшено исключение из switchNetwork
//         // Добавлен throw, чтобы прервать текущий поток, так как сеть не та
//         throw new Error(
//             `Пожалуйста, переключитесь на сеть ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}). Вы сейчас на ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId}).`
//         );
//     }

//     return {
//         provider: ethereumProvider,
//         signer: ethSigner,
//         account: currentAccount,
//         network: currentNetwork,
//     };
// };

// // Функция для переключения сети
// const switchNetwork = async (chainId) => {
//     // MetaMask ожидает chainId в шестнадцатеричном формате
//     const hexChainId = `0x${parseInt(chainId, 10).toString(16)}`;
//     try {
//         await window.ethereum.request({
//             method: "wallet_switchEthereumChain",
//             params: [{ chainId: hexChainId }],
//         });
//     } catch (error) {
//         if (error.code === 4902) {
//             // Код 4902 означает, что сеть не добавлена в MetaMask.
//             // Здесь можно предложить пользователю добавить сеть, если она нестандартная.
//             console.warn(
//                 `Сеть ${EXPECTED_CHAIN_NAME} (ID: ${chainId}) не добавлена в MetaMask. Попробуйте добавить вручную.`
//             );
//             throw new Error(
//                 `Сеть ${EXPECTED_CHAIN_NAME} не найдена в вашем MetaMask. Пожалуйста, добавьте ее вручную или переключитесь.`
//             );
//         } else {
//             // Пользователь отклонил запрос на переключение сети или другая ошибка
//             throw new Error(
//                 `Ошибка при переключении сети: ${error.message || error}`
//             );
//         }
//     }
// };

// // Подписка на события MetaMask
// const subscribeToWeb3Events = (onAccountsChanged, onChainChanged) => {
//     if (window.ethereum) {
//         window.ethereum.on("accountsChanged", onAccountsChanged);
//         // chainChanged возвращает hex-строку chainId
//         window.ethereum.on("chainChanged", (chainIdHex) =>
//             onChainChanged(chainIdHex)
//         );
//     }
// };

// // Отписка от событий MetaMask
// const unsubscribeFromWeb3Events = (onAccountsChanged, onChainChanged) => {
//     if (window.ethereum) {
//         window.ethereum.removeListener("accountsChanged", onAccountsChanged);
//         window.ethereum.removeListener("chainChanged", onChainChanged);
//     }
// };

// // Компонент-провайдер контекста
// export const Web3AuthProvajder = ({ children }) => {
//     const [account, setAccount] = useState(null);
//     const [provider, setProvider] = useState(null);
//     const [signer, setSigner] = useState(null);
//     const [network, setNetwork] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const initWeb3 = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const {
//                 provider: ethProvider,
//                 signer: ethSigner,
//                 account: acc,
//                 network: net,
//             } = await connectWeb3Internal();

//             setAccount(acc);
//             setProvider(ethProvider);
//             setSigner(ethSigner);
//             setNetwork(net);
//         } catch (err) {
//             console.error("Ошибка инициализации Web3:", err);
//             setError(err.message || "Не удалось подключиться к Web3.");
//             setAccount(null);
//             setProvider(null);
//             setSigner(null);
//             setNetwork(null);
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         // Вызываем initWeb3 сразу при монтировании
//         initWeb3();

//         const handleAccountsChanged = (newAccounts) => {
//             if (newAccounts.length > 0) {
//                 console.log("Аккаунт изменен. Новый аккаунт:", newAccounts[0]);
//                 initWeb3(); // Переинициализируем Web3 при смене аккаунта
//             } else {
//                 // Пользователь отключил все аккаунты в MetaMask
//                 console.log("Кошелек отключен.");
//                 setAccount(null);
//                 setProvider(null);
//                 setSigner(null);
//                 setNetwork(null);
//                 setError("MetaMask отключен или аккаунты не выбраны.");
//             }
//         };

//         const handleChainChanged = (newChainIdHex) => {
//             console.log("Цепочка изменена. Новый Chain ID:", newChainIdHex);
//             // Сравниваем с ожидаемым ID (десятичным)
//             if (
//                 parseInt(newChainIdHex, 16).toString() !==
//                 EXPECTED_CHAIN_ID.toString()
//             ) {
//                 setError(
//                     `Вы переключились на неподдерживаемую сеть (ID: ${parseInt(
//                         newChainIdHex,
//                         16
//                     )}). Пожалуйста, вернитесь на ${EXPECTED_CHAIN_NAME}.`
//                 );
//                 // Не обнуляем account и прочее сразу, но показываем ошибку.
//                 // initWeb3 все равно проверит сеть и покажет ошибку.
//             } else {
//                 setError(null); // Если вернулись на правильную сеть, сбросить ошибку
//             }
//             initWeb3(); // Переинициализируем Web3 при смене сети
//         };

//         subscribeToWeb3Events(handleAccountsChanged, handleChainChanged);

//         return () => {
//             unsubscribeFromWeb3Events(
//                 handleAccountsChanged,
//                 handleChainChanged
//             );
//         };
//     }, [initWeb3]);

//     // Проверяем, подключена ли правильная сеть и есть ли аккаунт
//     const isConnected =
//         !!account &&
//         !!signer &&
//         network?.chainId?.toString() === EXPECTED_CHAIN_ID.toString();

//     // Значения, предоставляемые контекстом
//     const contextValue = {
//         account,
//         provider,
//         signer,
//         network,
//         isConnected,
//         loading,
//         error,
//         connectWallet: initWeb3, // Функция для повторного подключения или инициализации

//         // Функции для получения экземпляров контрактов
//         // Теперь передаем в них текущий chainId из состояния network
//         getShopCAPTokenContract: () =>
//             ContractServices.getShopCAPTokenContract(
//                 signer || provider,
//                 network?.chainId?.toString()
//             ),
//         getPartnerRegistryContract: () =>
//             ContractServices.getPartnerRegistryContract(
//                 signer || provider,
//                 network?.chainId?.toString()
//             ),
//         getCashbackManagerContract: () =>
//             ContractServices.getCashbackManagerContract(
//                 signer || provider,
//                 network?.chainId?.toString()
//             ),
//         getShopCAPPlatformContract: () =>
//             ContractServices.getShopCAPPlatformContract(
//                 signer || provider,
//                 network?.chainId?.toString()
//             ),

//         // Функции для взаимодействия с контрактами (для удобства, можно вызывать и напрямую из ContractServices)
//         // Эти функции принимают необходимые параметры, включая текущий chainId
//         getTokenBalance: (tokenAddress, accountAddress) =>
//             ContractServices.getTokenBalance(
//                 provider,
//                 tokenAddress,
//                 accountAddress,
//                 network?.chainId?.toString()
//             ),
//         transferTokens: (tokenAddress, toAddress, amount) =>
//             ContractServices.transferTokens(
//                 signer,
//                 tokenAddress,
//                 toAddress,
//                 amount,
//                 network?.chainId?.toString()
//             ),
//         registerPartner: (name, description, referralLink, ownerAddress) =>
//             ContractServices.registerPartner(
//                 signer,
//                 name,
//                 description,
//                 referralLink,
//                 ownerAddress,
//                 network?.chainId?.toString()
//             ),
//         getPartnerDetails: (partnerId) =>
//             ContractServices.getPartnerDetails(
//                 provider,
//                 partnerId,
//                 network?.chainId?.toString()
//             ),
//         getTotalPartners: () =>
//             ContractServices.getTotalPartners(
//                 provider,
//                 network?.chainId?.toString()
//             ),
//         getAllPartners: () =>
//             ContractServices.getAllPartners(
//                 provider,
//                 network?.chainId?.toString()
//             ),
//         mintTokensForReferral: (userAddress, referrerId, amount) =>
//             ContractServices.mintTokensForReferral(
//                 signer,
//                 userAddress,
//                 referrerId,
//                 amount,
//                 network?.chainId?.toString()
//             ),
//         // ... другие функции из contractServices, если хотите обернуть их здесь
//     };

//     return (
//         <AuthContext.Provider value={contextValue}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// // src/components/Auth/Web3AuthContext.js
// import React, { createContext, useState, useEffect, useCallback } from "react";
// import { ethers } from "ethers";
// import {
//     contractAddresses,
//     contractABIs,
//     EXPECTED_CHAIN_ID, // Это число или строка, представляющая ID сети
//     EXPECTED_CHAIN_NAME,
// } from "../Utils/contract-config"; // Импорт конфигурации контрактов
// import { ABI as ShopCAPTokenABI } from "../../contracts/ShopCAPToken.json"; // Предполагается путь к ABI
// import { ABI as PartnerRegistryABI } from "../../contracts/PartnerRegistry.json"; // Предполагается путь к ABI

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [account, setAccount] = useState(null); // Адрес пользователя
//     const [provider, setProvider] = useState(null); // ethers провайдер
//     const [signer, setSigner] = useState(null); // ethers сайнер (для подписания транзакций)
//     const [network, setNetwork] = useState(null); // Информация о текущей сети
//     const [loading, setLoading] = useState(true); // Состояние загрузки
//     const [error, setError] = useState(null); // Ошибки, например, "MetaMask не установлен"

//     // Контракты
//     const [shopCAPTokenContract, setShopCAPTokenContract] = useState(null);
//     const [partnerRegistryContract, setPartnerRegistryContract] =
//         useState(null);

//     // Функция для подключения кошелька
//     const connectWallet = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             if (!window.ethereum) {
//                 setError(
//                     "MetaMask или другой Web3-кошелек не обнаружен. Пожалуйста, установите его."
//                 );
//                 setLoading(false);
//                 return;
//             }

//             // Запрашиваем доступ к аккаунтам пользователя
//             const accounts = await window.ethereum.request({
//                 method: "eth_requestAccounts",
//             });
//             const currentAccount = accounts[0];
//             setAccount(currentAccount);

//             // Инициализируем провайдер и сайнер
//             const ethProvider = new ethers.BrowserProvider(window.ethereum);
//             setProvider(ethProvider);

//             const ethSigner = await ethProvider.getSigner(currentAccount);
//             setSigner(ethSigner);

//             // Получаем информацию о сети
//             const currentNetwork = await ethProvider.getNetwork();
//             setNetwork(currentNetwork);

//             if (
//                 currentNetwork.chainId.toString() !==
//                 EXPECTED_CHAIN_ID.toString()
//             ) {
//                 setError(
//                     `Пожалуйста, переключитесь на сеть ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}).`
//                 );
//                 // Попытаться переключить сеть (необязательно, но улучшает UX)
//                 try {
//                     await window.ethereum.request({
//                         method: "wallet_switchEthereumChain",
//                         params: [
//                             {
//                                 chainId: `0x${parseInt(
//                                     EXPECTED_CHAIN_ID,
//                                     10
//                                 ).toString(16)}`,
//                             },
//                         ], // Преобразуем в hex-строку
//                     });
//                     // После успешного переключения сеть должна обновиться через событие 'chainChanged'
//                     // поэтому явное обновление стейта здесь не требуется, оно произойдет через useEffect
//                 } catch (switchError) {
//                     // Код ошибки 4902 означает, что сеть отсутствует и нужно ее добавить
//                     if (switchError.code === 4902) {
//                         try {
//                             // Здесь потребуется добавить параметры для новой сети, если она не стандартная
//                             // Для простоты, пока просто выводим ошибку, что сеть не найдена
//                             setError(
//                                 `Не удалось найти или добавить сеть ${EXPECTED_CHAIN_NAME}. Пожалуйста, добавьте ее вручную.`
//                             );
//                             console.error(
//                                 "Пользователь должен добавить сеть: ",
//                                 switchError
//                             );
//                         } catch (addError) {
//                             console.error(
//                                 "Ошибка при добавлении сети: ",
//                                 addError
//                             );
//                             setError(
//                                 "Не удалось добавить сеть. Пожалуйста, добавьте ее вручную."
//                             );
//                         }
//                     } else {
//                         console.error(
//                             "Ошибка при переключении сети: ",
//                             switchError
//                         );
//                         setError(
//                             "Произошла ошибка при переключении сети. Пожалуйста, переключите ее вручную."
//                         );
//                     }
//                     setLoading(false);
//                     return; // Прекращаем выполнение, так как сеть не та
//                 }
//             }

//             // Инициализация контрактов только после успешного подключения и проверки сети
//             if (contractAddresses.shopCAPToken && contractABIs.shopCAPToken) {
//                 const shopCAP = new ethers.Contract(
//                     contractAddresses.shopCAPToken,
//                     ShopCAPTokenABI, // Используем импортированный ABI
//                     ethSigner
//                 );
//                 setShopCAPTokenContract(shopCAP);
//             }

//             if (
//                 contractAddresses.partnerRegistry &&
//                 contractABIs.partnerRegistry
//             ) {
//                 const partnerReg = new ethers.Contract(
//                     contractAddresses.partnerRegistry,
//                     PartnerRegistryABI, // Используем импортированный ABI
//                     ethSigner
//                 );
//                 setPartnerRegistryContract(partnerReg);
//             }

//             localStorage.setItem(
//                 "blockRewardsConnectedAccount",
//                 currentAccount
//             ); // Сохраняем аккаунт
//             setLoading(false);
//         } catch (err) {
//             console.error("Ошибка подключения кошелька:", err);
//             if (err.code === 4001) {
//                 setError("Подключение отклонено пользователем.");
//             } else {
//                 setError(
//                     `Ошибка: ${err.message || "Не удалось подключить кошелек."}`
//                 );
//             }
//             setAccount(null);
//             setProvider(null);
//             setSigner(null);
//             setNetwork(null);
//             localStorage.removeItem("blockRewardsConnectedAccount"); // Удаляем сохраненный аккаунт при ошибке
//             setLoading(false);
//         }
//     }, []);

//     // Функция для отключения кошелька
//     const disconnectWallet = useCallback(() => {
//         setAccount(null);
//         setProvider(null);
//         setSigner(null);
//         setNetwork(null);
//         setShopCAPTokenContract(null);
//         setPartnerRegistryContract(null);
//         setError(null); // Сбросим ошибку при отключении
//         localStorage.removeItem("blockRewardsConnectedAccount");
//         console.log("Кошелек отключен.");
//     }, []);

//     // Эффект для инициализации при загрузке страницы и подписки на события MetaMask
//     useEffect(() => {
//         const storedAccount = localStorage.getItem(
//             "blockRewardsConnectedAccount"
//         );
//         if (storedAccount && !account) {
//             // Если аккаунт был сохранен, пытаемся подключиться
//             connectWallet();
//         } else {
//             setLoading(false); // Если нет сохраненного аккаунта или уже подключены, не загружаем
//         }

//         const handleAccountsChanged = (accounts) => {
//             console.log("Аккаунты изменены:", accounts);
//             if (accounts.length === 0) {
//                 // Пользователь отключил все аккаунты
//                 disconnectWallet();
//             } else if (accounts[0] !== account) {
//                 // Сменился активный аккаунт
//                 // Обновляем account и переподключаемся, чтобы обновить signer и контракты
//                 setAccount(accounts[0]);
//                 connectWallet();
//             }
//         };

//         const handleChainChanged = (chainId) => {
//             console.log("Сеть изменена:", chainId);
//             // Переподключаемся при смене сети, чтобы обновить провайдера, сайнера и контракты
//             // и повторно проверить на соответствие ожидаемой сети
//             connectWallet();
//         };

//         if (window.ethereum) {
//             window.ethereum.on("accountsChanged", handleAccountsChanged);
//             window.ethereum.on("chainChanged", handleChainChanged);
//             // window.ethereum.on('disconnect', disconnectWallet); // Не все провайдеры поддерживают это событие стабильно

//             return () => {
//                 // Отписываемся от событий при размонтировании компонента
//                 window.ethereum.removeListener(
//                     "accountsChanged",
//                     handleAccountsChanged
//                 );
//                 window.ethereum.removeListener(
//                     "chainChanged",
//                     handleChainChanged
//                 );
//                 // window.ethereum.removeListener('disconnect', disconnectWallet);
//             };
//         }
//     }, [connectWallet, account, disconnectWallet]); // Добавляем 'account' в зависимости для правильной работы 'handleAccountsChanged'

//     const value = {
//         account,
//         provider,
//         signer,
//         network,
//         connectWallet,
//         disconnectWallet,
//         loading,
//         error,
//         shopCAPTokenContract,
//         partnerRegistryContract,
//         contractAddresses, // Добавляем адреса контрактов для удобства
//     };

//     return (
//         <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
//     );
// };
