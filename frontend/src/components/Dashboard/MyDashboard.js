// src/components/MyDashboard/MyDashboard.js
import React, { useState, useEffect, useCallback } from "react";
// НЕ НУЖЕН ethers здесь для подключения - его предоставляет контекст
// import { ethers } from "ethers";

// Импортируем наши сервисные функции, но уже не для получения провайдера/сигнера,
// а для получения экземпляров контрактов и вызова их методов.
import {
    getShopCAPTokenContract,
    getShopCAPPlatformContract,
    getTokenBalance,
    registerPartner,
    mintReferralTokens, // Теперь эта функция экспортируется из contractServices
    // Импортируйте любые другие нужные функции из service
} from "../../services/contractServices";

import { uploadJSONToPinata } from "../../services/ipfsService";

// Импортируем хук для доступа к Web3-контексту
import { useWeb3Auth } from "../Auth/Web3AuthContext";

function MyDashboard() {
    // Получаем состояние и функции из Web3AuthContext
    const {
        account,
        provider,
        signer,
        network,
        loading,
        error,
        connectWallet,
    } = useWeb3Auth();

    // Состояния специфичные для дашборда
    const [scapBalance, setScapBalance] = useState("0");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false); // Для операций внутри дашборда
    const [dashboardError, setDashboardError] = useState(null);

    // Состояние для формы регистрации партнера (пример)
    const [partnerName, setPartnerName] = useState("");
    const [partnerDescription, setPartnerDescription] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
    const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);
    const [partnerRegistrationMessage, setPartnerRegistrationMessage] =
        useState("");

    // Эффект для получения баланса SCAP после подключения
    useEffect(() => {
        const fetchBalance = async () => {
            if (account && provider) {
                // Проверяем наличие аккаунта и провайдера
                setIsLoadingDashboard(true);
                setDashboardError(null);
                try {
                    const tokenContract = getShopCAPTokenContract(provider); // Для чтения достаточно провайдера
                    if (tokenContract) {
                        const balance = await getTokenBalance(
                            tokenContract,
                            account
                        );
                        setScapBalance(balance);
                    }
                } catch (err) {
                    console.error("Ошибка получения баланса SCAP:", err);
                    setDashboardError("Не удалось получить баланс SCAP.");
                } finally {
                    setIsLoadingDashboard(false);
                }
            }
        };

        fetchBalance();
    }, [account, provider]); // Зависит от аккаунта и провайдера из контекста

    // Пример функции для регистрации партнера
    const handleRegisterPartner = async (e) => {
        e.preventDefault();
        if (!signer) {
            // Для записи нужна подпись, поэтому используем signer
            setPartnerRegistrationMessage(
                "Кошелек не подключен или нет подписанта."
            );
            return;
        }

        setIsRegisteringPartner(true);
        setPartnerRegistrationMessage("");

        try {
            const platformContract = getShopCAPPlatformContract(signer);
            if (!platformContract) {
                throw new Error(
                    "Не удалось получить контракт ShopCAPPlatform."
                );
            }

            // Загрузка метаданных партнера в IPFS (например, название, описание, ссылка)
            const metadata = {
                name: partnerName,
                description: partnerDescription,
                referralLink: referralLink,
                owner: partnerOwnerAddress, // Можно использовать фактический адрес, а не переданный
            };
            // const ipfsHash = await uploadJSONToPinata(metadata); // Предполагаем, что ipfsService вернет хэш

            // Для простоты пока без IPFS, либо используйте ipfsHash в `registerPartner`
            await registerPartner(
                platformContract,
                partnerName,
                partnerDescription,
                referralLink, // Или ipfsHash, если измените сигнатуру registerPartner
                partnerOwnerAddress
            );
            setPartnerRegistrationMessage("Партнер успешно зарегистрирован!");
            // Очистка формы
            setPartnerName("");
            setPartnerDescription("");
            setReferralLink("");
            setPartnerOwnerAddress("");
        } catch (err) {
            console.error("Ошибка регистрации партнера:", err);
            setPartnerRegistrationMessage(
                `Ошибка: ${err.message || "Неизвестная ошибка"}`
            );
        } finally {
            setIsRegisteringPartner(false);
        }
    };

    // Пример функции минтинга токенов
    const handleMintTokens = async () => {
        if (!signer) {
            setDashboardError(
                "Кошелек не подключен или нет подписанта для минтинга."
            );
            return;
        }
        setIsLoadingDashboard(true);
        setDashboardError(null);
        try {
            const tokenContract = getShopCAPTokenContract(signer);
            if (tokenContract) {
                // Пример: минтим 100 токенов на свой аккаунт
                await mintReferralTokens(tokenContract, account, "100");
                setDashboardError(
                    "100 SCAP успешно сминтированы на ваш аккаунт!"
                );
                // Перезагрузить баланс после минтинга
                const balance = await getTokenBalance(tokenContract, account);
                setScapBalance(balance);
            }
        } catch (err) {
            console.error("Ошибка при минтинге SCAP:", err);
            setDashboardError(
                `Ошибка при минтинге: ${err.message || "Неизвестная ошибка"}`
            );
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    // Если Web3AuthContext находится в состоянии загрузки
    if (loading) {
        return (
            <div className="dashboard-loading">Подключение к кошельку...</div>
        );
    }

    // Если есть ошибка подключения (например, MetaMask не установлен или сеть неверна)
    if (error) {
        // Мы можем предложить переподключиться, или просто отобразить ошибку.
        // ConnectWalletPage уже обрабатывает начальную ошибку, но этот error может быть
        // ошибкой, возникшей после первоначального подключения (например, сменили сеть).
        return (
            <div className="dashboard-error">
                <h2>Ошибка Web3:</h2>
                <p>{error}</p>
                <button onClick={connectWallet}>
                    Попробовать переподключиться
                </button>
            </div>
        );
    }

    // Если нет аккаунта, значит, пользователь не подключен
    if (!account) {
        // В App.js уже есть логика, которая покажет ConnectWalletPage,
        // но здесь можно подстраховаться или дать другую инструкцию.
        return (
            <div className="dashboard-not-connected">
                Пожалуйста, подключите ваш кошелек через главную страницу.
            </div>
        );
    }

    return (
        <div className="my-dashboard">
            <h2>Моя Панель Управления</h2>
            <p>
                Подключенный аккаунт: <strong>{account}</strong>
            </p>
            <p>
                Сеть:{" "}
                <strong>
                    {network
                        ? `${network.name} (ID: ${network.chainId})`
                        : "Неизвестно"}
                </strong>
            </p>
            <p>
                Баланс SCAP:{" "}
                <strong>
                    {isLoadingDashboard ? "Загрузка..." : scapBalance}
                </strong>
            </p>

            {dashboardError && (
                <div className="error-message">{dashboardError}</div>
            )}

            <button onClick={handleMintTokens} disabled={isLoadingDashboard}>
                {isLoadingDashboard
                    ? "Минтинг..."
                    : "Сминтить 100 SCAP (для теста)"}
            </button>

            {/* Пример формы для регистрации партнера */}
            <h3>Зарегистрировать нового партнера</h3>
            <form onSubmit={handleRegisterPartner}>
                <div>
                    <label htmlFor="partnerName">Название партнера:</label>
                    <input
                        id="partnerName"
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="partnerDescription">Описание:</label>
                    <textarea
                        id="partnerDescription"
                        value={partnerDescription}
                        onChange={(e) => setPartnerDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="referralLink">Реферальная ссылка:</label>
                    <input
                        id="referralLink"
                        type="url"
                        value={referralLink}
                        onChange={(e) => setReferralLink(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="partnerOwnerAddress">
                        Адрес владельца партнера:
                    </label>
                    <input
                        id="partnerOwnerAddress"
                        type="text"
                        value={partnerOwnerAddress}
                        onChange={(e) => setPartnerOwnerAddress(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isRegisteringPartner}>
                    {isRegisteringPartner
                        ? "Регистрация..."
                        : "Зарегистрировать партнера"}
                </button>
            </form>
            {partnerRegistrationMessage && <p>{partnerRegistrationMessage}</p>}
        </div>
    );
}

export default MyDashboard;

// // src/components/MyDashboard/MyDashboard.js

// import React, { useState, useEffect, useCallback } from "react";
// import { ethers } from "ethers"; // Для работы с ethers.js в UI
// // Импортируем наши сервисные функции
// import {
//     getShopCAPTokenContract,
//     getShopCAPPlatformContract,
//     getTokenBalance,
//     registerPartner, // Пример функции, которую мы хотим использовать
//     // Можете импортировать все остальные функции, которые вам нужны
// } from "../../services/contractServices";

// import { uploadJSONToPinata } from "../../services/ipfsService"; // Пример IPFS функции

// // Предположим, что у вас есть файл с ожидаемым Chain ID
// import {
//     EXPECTED_CHAIN_ID,
//     EXPECTED_CHAIN_NAME,
// } from "../Utils/contract-config";

// // Вам может понадобиться Web3Modal или другая библиотека для работы с поставщиком,
// // но для простоты MVP будем пока напрямую работать с window.ethereum.
// // В реальном проекте используйте Context API для управления подключением Web3.

// function MyDashboard() {
//     const [provider, setProvider] = useState(null);
//     const [signer, setSigner] = useState(null);
//     const [currentAccount, setCurrentAccount] = useState(null);
//     const [currentChainId, setCurrentChainId] = useState(null);
//     const [scapBalance, setScapBalance] = useState("0");
//     const [isConnected, setIsConnected] = useState(false);
//     const [connectionError, setConnectionError] = useState(null);

//     // Состояние для формы регистрации партнера (пример)
//     const [partnerName, setPartnerName] = useState("");
//     const [partnerDescription, setPartnerDescription] = useState("");
//     const [referralLink, setReferralLink] = useState("");
//     const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
//     const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);
//     const [partnerRegistrationMessage, setPartnerRegistrationMessage] =
//         useState("");

//     // 1. Функция для подключения к MetaMask
//     const connectWallet = useCallback(async () => {
//         if (window.ethereum) {
//             try {
//                 // Запрашиваем доступ к аккаунтам
//                 const accounts = await window.ethereum.request({
//                     method: "eth_requestAccounts",
//                 });
//                 const newProvider = new ethers.providers.Web3Provider(
//                     window.ethereum
//                 );
//                 const newSigner = newProvider.getSigner();
//                 const network = await newProvider.getNetwork();
//                 const chainId = `0x${network.chainId.toString(16)}`;

//                 // Проверка Chain ID
//                 if (chainId.toLowerCase() !== EXPECTED_CHAIN_ID.toLowerCase()) {
//                     setConnectionError(
//                         `Пожалуйста, переключитесь на сеть ${EXPECTED_CHAIN_NAME} (Chain ID: ${EXPECTED_CHAIN_ID}). Вы сейчас в сети ${network.name} (Chain ID: ${chainId}).`
//                     );
//                     setIsConnected(false);
//                     return;
//                 }

//                 setProvider(newProvider);
//                 setSigner(newSigner);
//                 setCurrentAccount(accounts[0]);
//                 setCurrentChainId(chainId);
//                 setIsConnected(true);
//                 setConnectionError(null);

//                 // Слушатели событий для изменения аккаунта/сети
//                 window.ethereum.on("accountsChanged", (newAccounts) => {
//                     if (newAccounts.length === 0) {
//                         // Пользователь отключил все аккаунты
//                         resetConnection();
//                     } else {
//                         setCurrentAccount(newAccounts[0]);
//                     }
//                 });
//                 window.ethereum.on("chainChanged", (_chainId) => {
//                     window.location.reload(); // Рекомендуется перезагрузить страницу при смене сети
//                 });
//             } catch (error) {
//                 console.error("Connection failed:", error);
//                 setConnectionError(
//                     "Не удалось подключиться к MetaMask. Пожалуйста, убедитесь, что он установлен и вы дали разрешение."
//                 );
//                 setIsConnected(false);
//             }
//         } else {
//             setConnectionError(
//                 "MetaMask не обнаружен. Пожалуйста, установите его."
//             );
//             setIsConnected(false);
//         }
//     }, []);

//     // Функция для сброса подключения
//     const resetConnection = () => {
//         setProvider(null);
//         setSigner(null);
//         setCurrentAccount(null);
//         setCurrentChainId(null);
//         setIsConnected(false);
//         setScapBalance("0");
//         setConnectionError(null);
//     };

//     // 2. Эффект для автоматического подключения при загрузке (если пользователь уже одобрил)
//     useEffect(() => {
//         // Проверяем, авторизован ли пользователь в MetaMask
//         // Этот подход менее агрессивен, чем eth_requestAccounts
//         const checkConnection = async () => {
//             if (window.ethereum) {
//                 try {
//                     const accounts = await window.ethereum.request({
//                         method: "eth_accounts",
//                     });
//                     if (accounts.length > 0) {
//                         // Если есть аккаунты, пытаемся подключиться
//                         connectWallet();
//                     }
//                 } catch (error) {
//                     console.error("Error checking accounts:", error);
//                 }
//             }
//         };
//         checkConnection();
//         // Убираем слушатели при размонтировании компонента, чтобы избежать утечек памяти
//         return () => {
//             if (window.ethereum && window.ethereum.removeListener) {
//                 window.ethereum.removeListener(
//                     "accountsChanged",
//                     connectWallet
//                 ); // Или более специфичную версию
//                 window.ethereum.removeListener(
//                     "chainChanged",
//                     window.location.reload
//                 );
//             }
//         };
//     }, [connectWallet]); // Зависимость от connectWallet, чтобы re-run при изменении

//     // 3. Эффект для получения баланса SCAP после подключения
//     useEffect(() => {
//         const fetchBalance = async () => {
//             if (isConnected && provider && currentAccount && currentChainId) {
//                 try {
//                     // Мы используем getTokenBalance из contractServices.js
//                     // Для этого нам сначала нужен адрес токена (получим его через getShopCAPTokenContract)
//                     const tokenContractInstance = getShopCAPTokenContract(
//                         provider,
//                         currentChainId
//                     );
//                     if (tokenContractInstance) {
//                         const balance = await getTokenBalance(
//                             provider,
//                             tokenContractInstance.address,
//                             currentAccount,
//                             currentChainId
//                         );
//                         setScapBalance(balance);
//                     }
//                 } catch (error) {
//                     console.error("Error fetching SCAP balance:", error);
//                     setScapBalance("0");
//                 }
//             }
//         };
//         fetchBalance();
//     }, [isConnected, provider, currentAccount, currentChainId]);

//     // 4. Пример функции для регистрации партнера
//     const handleRegisterPartner = async (e) => {
//         e.preventDefault();
//         if (!signer || !currentAccount || !currentChainId) {
//             setPartnerRegistrationMessage("Пожалуйста, подключите кошелек.");
//             return;
//         }
//         if (
//             !partnerName ||
//             !partnerDescription ||
//             !referralLink ||
//             !partnerOwnerAddress
//         ) {
//             setPartnerRegistrationMessage("Пожалуйста, заполните все поля.");
//             return;
//         }

//         setIsRegisteringPartner(true);
//         setPartnerRegistrationMessage("Регистрация партнера...");
//         try {
//             // Вызываем функцию registerPartner из contractServices.js
//             const tx = await registerPartner(
//                 signer,
//                 partnerName,
//                 partnerDescription,
//                 referralLink,
//                 partnerOwnerAddress,
//                 currentChainId
//             );
//             await tx.wait(); // Ждем подтверждения транзакции
//             setPartnerRegistrationMessage(
//                 `Партнер "${partnerName}" успешно зарегистрирован! Хеш транзакции: ${tx.hash}`
//             );
//             // Очищаем форму
//             setPartnerName("");
//             setPartnerDescription("");
//             setReferralLink("");
//             setPartnerOwnerAddress("");
//         } catch (error) {
//             console.error("Error registering partner:", error);
//             setPartnerRegistrationMessage(
//                 `Ошибка регистрации партнера: ${
//                     error.message || error.data?.message
//                 }`
//             );
//         } finally {
//             setIsRegisteringPartner(false);
//         }
//     };

//     // 5. Пример использования IPFS (можно для сохранения метаданных партнера)
//     const handleUploadPartnerDataToIPFS = async () => {
//         if (!partnerName) {
//             alert("Введите имя партнера для данных IPFS.");
//             return;
//         }
//         const dataToUpload = {
//             name: partnerName,
//             description: partnerDescription,
//             timestamp: new Date().toISOString(),
//         };
//         const cid = await uploadJSONToPinata(dataToUpload);
//         if (cid) {
//             alert(`Данные партнера успешно загружены в IPFS. CID: ${cid}`);
//             console.log("IPFS CID:", cid);
//         } else {
//             alert("Не удалось загрузить данные партнера в IPFS.");
//         }
//     };

//     return (
//         <div
//             style={{
//                 fontFamily: "Arial, sans-serif",
//                 maxWidth: "800px",
//                 margin: "20px auto",
//                 padding: "20px",
//                 border: "1px solid #ccc",
//                 borderRadius: "8px",
//             }}
//         >
//             <h1>Мой Dashboard</h1>

//             {/* Секция подключения к кошельку */}
//             <section
//                 style={{
//                     marginBottom: "30px",
//                     padding: "15px",
//                     border: "1px solid #eee",
//                     borderRadius: "5px",
//                     backgroundColor: "#f9f9f9",
//                 }}
//             >
//                 <h2>Статус кошелька</h2>
//                 {connectionError && (
//                     <p style={{ color: "red" }}>{connectionError}</p>
//                 )}
//                 {!isConnected ? (
//                     <button
//                         onClick={connectWallet}
//                         style={{
//                             padding: "10px 20px",
//                             fontSize: "16px",
//                             cursor: "pointer",
//                             backgroundColor: "#007bff",
//                             color: "white",
//                             border: "none",
//                             borderRadius: "5px",
//                         }}
//                     >
//                         Подключить MetaMask
//                     </button>
//                 ) : (
//                     <div>
//                         <p>
//                             Подключено к: <strong>{currentAccount}</strong>
//                         </p>
//                         <p>
//                             В сети:{" "}
//                             <strong>
//                                 {currentChainId} ({EXPECTED_CHAIN_NAME})
//                             </strong>
//                         </p>
//                         <p>
//                             Баланс SCAP: <strong>{scapBalance} SCAP</strong>
//                         </p>
//                         <button
//                             onClick={resetConnection}
//                             style={{
//                                 padding: "8px 15px",
//                                 fontSize: "14px",
//                                 cursor: "pointer",
//                                 backgroundColor: "#dc3545",
//                                 color: "white",
//                                 border: "none",
//                                 borderRadius: "5px",
//                             }}
//                         >
//                             Отключить
//                         </button>
//                     </div>
//                 )}
//             </section>

//             {/* Секция регистрации партнера */}
//             <section
//                 style={{
//                     marginBottom: "30px",
//                     padding: "15px",
//                     border: "1px solid #eee",
//                     borderRadius: "5px",
//                     backgroundColor: "#f9f9f9",
//                 }}
//             >
//                 <h2>Регистрация нового партнера</h2>
//                 <form
//                     onSubmit={handleRegisterPartner}
//                     style={{ display: "grid", gap: "10px", maxWidth: "500px" }}
//                 >
//                     <input
//                         type="text"
//                         placeholder="Имя партнера"
//                         value={partnerName}
//                         onChange={(e) => setPartnerName(e.target.value)}
//                         required
//                         style={{
//                             padding: "8px",
//                             borderRadius: "4px",
//                             border: "1px solid #ddd",
//                         }}
//                     />
//                     <textarea
//                         placeholder="Описание партнера"
//                         value={partnerDescription}
//                         onChange={(e) => setPartnerDescription(e.target.value)}
//                         rows="3"
//                         required
//                         style={{
//                             padding: "8px",
//                             borderRadius: "4px",
//                             border: "1px solid #ddd",
//                         }}
//                     ></textarea>
//                     <input
//                         type="text"
//                         placeholder="Реферальная ссылка"
//                         value={referralLink}
//                         onChange={(e) => setReferralLink(e.target.value)}
//                         required
//                         style={{
//                             padding: "8px",
//                             borderRadius: "4px",
//                             border: "1px solid #ddd",
//                         }}
//                     />
//                     <input
//                         type="text"
//                         placeholder="Адрес владельца для регистрации (0x...)"
//                         value={partnerOwnerAddress}
//                         onChange={(e) => setPartnerOwnerAddress(e.target.value)}
//                         required
//                         style={{
//                             padding: "8px",
//                             borderRadius: "4px",
//                             border: "1px solid #ddd",
//                         }}
//                     />
//                     <button
//                         type="submit"
//                         disabled={!isConnected || isRegisteringPartner}
//                         style={{
//                             padding: "10px 20px",
//                             fontSize: "16px",
//                             cursor: isConnected ? "pointer" : "not-allowed",
//                             backgroundColor: isConnected
//                                 ? "#28a745"
//                                 : "#6c757d",
//                             color: "white",
//                             border: "none",
//                             borderRadius: "5px",
//                         }}
//                     >
//                         {isRegisteringPartner
//                             ? "Регистрация..."
//                             : "Зарегистрировать партнера"}
//                     </button>
//                 </form>
//                 {partnerRegistrationMessage && (
//                     <p
//                         style={{
//                             marginTop: "10px",
//                             color: partnerRegistrationMessage.includes(
//                                 "успешно"
//                             )
//                                 ? "green"
//                                 : "red",
//                         }}
//                     >
//                         {partnerRegistrationMessage}
//                     </p>
//                 )}
//                 <button
//                     onClick={handleUploadPartnerDataToIPFS}
//                     disabled={!partnerName}
//                     style={{
//                         marginTop: "10px",
//                         padding: "8px 15px",
//                         fontSize: "14px",
//                         cursor: "pointer",
//                         backgroundColor: "#17a2b8",
//                         color: "white",
//                         border: "none",
//                         borderRadius: "5px",
//                     }}
//                 >
//                     Загрузить данные партнера в IPFS (пример)
//                 </button>
//             </section>

//             {/* Здесь можно добавить другие секции: список партнеров, управление кэшбэком и т.д. */}
//             <section
//                 style={{
//                     padding: "15px",
//                     border: "1px solid #eee",
//                     borderRadius: "5px",
//                     backgroundColor: "#f9f9f9",
//                 }}
//             >
//                 <h2>Другие функции</h2>
//                 <p>
//                     Здесь будут другие элементы управления и отображения данных,
//                     используя функции из ваших сервисов.
//                 </p>
//                 {/* Например:
//                 <button onClick={loadPartnersList}>Загрузить список партнеров</button>
//                 <ul>
//                     {partners.map(p => <li key={p.address}>{p.name} - {p.address}</li>)}
//                 </ul>
//                 */}
//             </section>
//         </div>
//     );
// }

// export default MyDashboard;
