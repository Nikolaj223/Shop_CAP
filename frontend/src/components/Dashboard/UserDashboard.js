import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import {
    getDemoScapBalance,
    getScapBalance,
} from "../../services/ShopService";
import {
    formatAmount,
    formatDateTime,
    formatRubFromEth,
} from "../../utils/locale";
import { useEthRubRate } from "../../hooks/useEthRubRate";
import "./UserDashboard.css";

const UserDashboard = () => {
    const {
        account,
        authType,
        canUseBlockchain,
        connectWallet,
        currentUser,
        isAuthenticated,
        provider,
        userKey,
    } = useWeb3Auth();
    const { ethRubRate } = useEthRubRate();
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [scapBalance, setScapBalance] = useState("0");
    const [loading, setLoading] = useState(true);

    const activeUserKey = (userKey || "guest").toLowerCase();

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);

            const storageKey = `purchases_${activeUserKey}`;
            const savedPurchases = localStorage.getItem(storageKey);
            setPurchasedItems(savedPurchases ? JSON.parse(savedPurchases) : []);

            if (canUseBlockchain && provider && account) {
                try {
                    const balance = await getScapBalance(provider, account);
                    setScapBalance(balance);
                } catch (error) {
                    console.error("Ошибка при получении баланса:", error);
                    setScapBalance("0");
                }
            } else {
                setScapBalance(getDemoScapBalance(activeUserKey));
            }

            setLoading(false);
        };

        void initDashboard();
    }, [account, activeUserKey, canUseBlockchain, provider]);

    if (loading) {
        return <div className="vault-loading">Загрузка профиля...</div>;
    }

    return (
        <div className="vault-page">
            <div className="vault-balance-card">
                <div className="vault-balance-info">
                    <p>Ваш баланс SCAP</p>
                    <h1>
                        {canUseBlockchain
                            ? `${formatAmount(scapBalance)} SCAP`
                            : `${formatAmount(scapBalance, 2)} SCAP demo`}
                    </h1>
                    <small>
                        Режим:{" "}
                        {canUseBlockchain
                            ? authType === "hybrid"
                                ? "логин + кошелек"
                                : "кошелек"
                            : isAuthenticated
                              ? "обычная авторизация / demo"
                              : "гостевой demo"}
                    </small>
                    <br />
                    <small>
                        Пользователь:{" "}
                        {currentUser?.email ||
                            currentUser?.walletAddress ||
                            currentUser?.displayName ||
                            "Гостевой demo-профиль"}
                    </small>
                    {!canUseBlockchain && (
                        <>
                            <br />
                            <small>
                                Баланс, покупки и кешбек сейчас считаются
                                локально. Это удобно для показа проекта без
                                MetaMask и без токенов.
                            </small>
                            <br />
                            <button
                                type="button"
                                className="vault-inline-button"
                                onClick={() => {
                                    void connectWallet();
                                }}
                            >
                                Подключить кошелек
                            </button>
                            {!isAuthenticated && (
                                <Link
                                    to="/auth"
                                    className="vault-link-button secondary"
                                >
                                    Войти по email
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>

            <h2 className="vault-title">Мои покупки</h2>

            {purchasedItems.length === 0 ? (
                <div className="vault-empty-state">
                    <p>
                        История покупок пока пуста. На странице маркетплейса
                        можно оформить demo-покупку даже без MetaMask, и она
                        сразу появится здесь.
                    </p>
                </div>
            ) : (
                <div className="vault-grid">
                    {purchasedItems.map((item, index) => (
                        <div key={index} className="vault-card">
                            <div className="vault-status-badge">
                                {item.mode === "demo"
                                    ? "Demo кешбек начислен"
                                    : "Кешбек начислен"}
                            </div>
                            <div className="vault-purchase-badge">RM</div>
                            <h3>{item.name}</h3>
                            <p className="vault-date">
                                {formatDateTime(item.purchaseDate)}
                            </p>
                            <div className="vault-price-block">
                                <span className="vault-price-value">
                                    {formatRubFromEth(item.price, ethRubRate)}
                                </span>
                            </div>
                            {item.rewardScap && (
                                <div className="vault-price-note">
                                    Начислено: {formatAmount(item.rewardScap, 2)}{" "}
                                    SCAP demo
                                </div>
                            )}
                            {item.txHash && (
                                <div className="vault-tx-link">
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Открыть в Etherscan
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
