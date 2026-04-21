import React, { useState, useEffect, useCallback } from "react";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import {
    buyItemDemo,
    buyItemSimulated,
    fetchAllItems,
    listDemoItem,
    listItemInPlatform,
} from "../../services/ShopService";
import {
    convertRubToEth,
    formatDateTime,
    formatRub,
    formatRubFromEth,
} from "../../utils/locale";
import { useEthRubRate } from "../../hooks/useEthRubRate";
import "./Home.css";

function Home() {
    const { isAuthenticated, signer, provider, userKey } = useWeb3Auth();
    const [isPending, setIsPending] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [brands, setBrands] = useState([]);
    const {
        ethRubRate,
        rateUpdatedAt,
        rateSource,
        isRateFallback,
        isRateLoading,
    } = useEthRubRate();
    const [newBrand, setNewBrand] = useState({
        name: "",
        priceRub: "2500",
        partnerId: "0",
    });

    const activeUserKey = userKey || "guest";
    const isDemoMode = !signer;

    const loadMarketplaceData = useCallback(async () => {
        try {
            const items = await fetchAllItems(provider);
            setBrands(items.filter((item) => item.isActive));
        } catch (error) {
            console.error("Ошибка загрузки товаров:", error);
        }
    }, [provider]);

    useEffect(() => {
        void loadMarketplaceData();
    }, [loadMarketplaceData]);

    const buildPriceInEth = () => {
        const normalizedRubValue = newBrand.priceRub
            .toString()
            .replace(/\s/g, "")
            .replace(",", ".");
        const priceInEth = convertRubToEth(normalizedRubValue, ethRubRate);

        if (priceInEth === null || priceInEth <= 0) {
            throw new Error(
                "Не удалось рассчитать цену товара по текущему курсу."
            );
        }

        return {
            normalizedRubValue,
            priceInEth,
        };
    };

    const handleAddAndMint = async (event) => {
        event.preventDefault();
        setIsPending(true);

        try {
            const { normalizedRubValue, priceInEth } = buildPriceInEth();

            if (signer) {
                await listItemInPlatform(
                    signer,
                    newBrand.name,
                    priceInEth.toFixed(8),
                    100,
                    newBrand.partnerId
                );

                alert("Товар успешно добавлен в блокчейн.");
            } else {
                await listDemoItem({
                    name: newBrand.name,
                    partnerId: newBrand.partnerId,
                    priceEth: priceInEth.toFixed(8),
                    priceRub: normalizedRubValue,
                    stock: 100,
                });

                alert(
                    "Товар добавлен в demo-режиме. Он сохранен локально и доступен для демонстрации без MetaMask."
                );
            }

            setNewBrand({
                name: "",
                priceRub: "2500",
                partnerId: "0",
            });
            setShowAdmin(false);
            await loadMarketplaceData();
        } catch (error) {
            console.error(error);
            alert(
                `Ошибка создания товара: ${
                    error.reason || error.message || String(error)
                }`
            );
        } finally {
            setIsPending(false);
        }
    };

    const handleBuy = async (brand) => {
        setIsPending(true);

        try {
            if (signer) {
                const result = await buyItemSimulated(signer, brand);

                if (result.success) {
                    const userAddress = await signer.getAddress();
                    const storageKey = `purchases_${userAddress.toLowerCase()}`;
                    const currentPurchasedRaw = localStorage.getItem(storageKey);
                    const currentPurchases = currentPurchasedRaw
                        ? JSON.parse(currentPurchasedRaw)
                        : [];

                    const newPurchase = {
                        ...brand,
                        txHash: result.hash,
                        purchaseDate: new Date().toISOString(),
                        status: "Кешбек начислен",
                        mode: "blockchain",
                    };

                    localStorage.setItem(
                        storageKey,
                        JSON.stringify([...currentPurchases, newPurchase])
                    );

                    alert(
                        `Покупка обработана успешно. Кешбек начислен на ваш кошелек. Сумма покупки: ${formatRubFromEth(
                            brand.price,
                            ethRubRate
                        )}.`
                    );
                }

                return;
            }

            const result = await buyItemDemo({
                item: brand,
                userKey: activeUserKey,
                ethRubRate,
            });

            if (result.success) {
                alert(
                    `Demo-покупка сохранена локально. Начислено ${result.rewardScap} SCAP demo. Этот режим подходит для показа проекта без MetaMask и без токенов.`
                );
            }
        } catch (error) {
            console.error("Ошибка покупки:", error);
            alert(
                error.reason ||
                    error.message ||
                    "Ошибка транзакции при покупке товара."
            );
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="home-page">
            <header className="hero-section">
                <span className="hero-kicker">Локализованный MVP</span>
                <h1>Маркетплейс с токенизированным кешбеком</h1>
                <p>
                    Покупайте товары и получайте кешбек в токенах SCAP
                    <span className="hero-inline-note">
                        {" "}
                        (on-chain тикер: SCAP)
                    </span>
                </p>
                <div className="hero-note">
                    Для пользователя цены на витрине показываются в рублях, а
                    нужный on-chain эквивалент рассчитывается автоматически по
                    текущему курсу ETH/RUB.
                </div>
                {!isAuthenticated && (
                    <div className="hero-note">
                        Даже без входа можно показать базовый сценарий как
                        гость. Если хотите персональный кабинет и отдельную
                        историю, используйте обычный вход по email и паролю.
                    </div>
                )}
                <div className="rate-box">
                    <div className="rate-box-header">
                        <strong>Текущий курс ETH/RUB</strong>
                        <span>{isRateLoading ? "Обновление..." : rateSource}</span>
                    </div>
                    <div className="rate-box-value">
                        1 ETH = {formatRub(ethRubRate)}
                    </div>
                    <div className="rate-box-note">
                        {rateUpdatedAt
                            ? `Обновлено: ${formatDateTime(
                                  new Date(rateUpdatedAt * 1000)
                              )}`
                            : "Время обновления пока недоступно."}
                        {isRateFallback
                            ? " Используется сохраненный или резервный курс."
                            : ""}
                    </div>
                </div>
                <button
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="btn-main"
                >
                    {showAdmin ? "Закрыть панель" : "Добавить товар"}
                </button>
            </header>

            {showAdmin && (
                <div className="admin-panel">
                    <h3>Добавление товара на платформу</h3>
                    <p className="admin-panel-note">
                        Цена вводится в рублях, а перед записью в блокчейн
                        автоматически конвертируется в ETH по текущему курсу.
                        {isDemoMode
                            ? " Сейчас товар сохранится только локально в demo-режиме."
                            : " Сейчас товар будет записан on-chain."}
                    </p>
                    <form onSubmit={handleAddAndMint} className="add-brand-form">
                        <input
                            type="text"
                            placeholder="Название товара"
                            value={newBrand.name}
                            onChange={(event) =>
                                setNewBrand({
                                    ...newBrand,
                                    name: event.target.value,
                                })
                            }
                            required
                        />
                        <input
                            type="text"
                            placeholder="Цена товара в рублях"
                            value={newBrand.priceRub}
                            onChange={(event) =>
                                setNewBrand({
                                    ...newBrand,
                                    priceRub: event.target.value,
                                })
                            }
                            required
                        />
                        <input
                            type="number"
                            placeholder="ID партнера (0 если без партнера)"
                            value={newBrand.partnerId}
                            onChange={(event) =>
                                setNewBrand({
                                    ...newBrand,
                                    partnerId: event.target.value,
                                })
                            }
                        />
                        <button
                            type="submit"
                            className="btn-main btn-create"
                            disabled={isPending}
                        >
                            {isPending
                                ? "Сохранение..."
                                : isDemoMode
                                  ? "Сохранить demo-товар"
                                  : "Записать в блокчейн"}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid-container">
                {brands.length > 0 ? (
                    brands.map((brand) => (
                        <div key={brand.id} className="brand-card nft-style">
                            <div className="card-media">
                                <span className="brand-icon">{brand.img}</span>
                            </div>
                            <div className="card-content">
                                <div className="card-header">
                                    <h3>{brand.name}</h3>
                                    <span className="category-tag">
                                        {brand.categoryLabel ||
                                            (brand.isDemo
                                                ? "Demo local"
                                                : "Демо-товар")}
                                    </span>
                                </div>
                                <div className="price-section">
                                    <div className="price-label">
                                        Цена товара
                                    </div>
                                    <div className="price-value">
                                        {formatRubFromEth(
                                            brand.price,
                                            ethRubRate
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="btn-main btn-buy"
                                    onClick={() => handleBuy(brand)}
                                    disabled={isPending}
                                >
                                    {isPending
                                        ? "Обработка..."
                                        : signer
                                          ? "Купить"
                                          : "Купить в demo"}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-items">
                        Товары пока не добавлены. Создайте первый товар для
                        витрины.
                    </p>
                )}
            </div>
        </div>
    );
}

export default Home;
