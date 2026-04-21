import React, { useState, useEffect, useCallback } from "react";
import {
    getPartnerRegistryContract,
    getShopCAPBalance,
    mintTokens,
    addPartner,
    getCashbackManagerContract,
    getAllPartners,
} from "../../services/contractServices";
import { fetchRegisteredUsers } from "../../services/userRegistryService";
import { formatAmount, formatDateTime, formatWallet } from "../../utils/locale";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import "./MyDashboard.css";

function MyDashboard() {
    const {
        account,
        canUseBlockchain,
        provider,
        signer,
        loading: authLoading,
    } = useWeb3Auth();

    const [scapBalance, setScapBalance] = useState("0");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [dashboardSuccessMessage, setDashboardSuccessMessage] =
        useState(null);

    const [partnerName, setPartnerName] = useState("");
    const [partnerDescription, setPartnerDescription] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
    const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);

    const [userReferrerId, setUserReferrerId] = useState(0);
    const [contractConfig, setContractConfig] = useState({
        basePercent: 1,
        userShare: 70,
        reserveShare: 20,
        burnShare: 10,
        referrerBonus: 0,
    });

    const [allPartners, setAllPartners] = useState([]);
    const [registeredUsers, setRegisteredUsers] = useState([]);

    const fetchScapBalance = useCallback(async () => {
        if (!account || !provider) {
            return;
        }

        try {
            const balance = await getShopCAPBalance(provider, account);
            setScapBalance(balance);
        } catch (err) {
            console.error("Ошибка получения баланса SCAP:", err);
        }
    }, [account, provider]);

    const fetchData = useCallback(async () => {
        if (!provider) {
            return;
        }

        try {
            const registryContract = await getPartnerRegistryContract(provider);
            const list = await getAllPartners(registryContract);
            setAllPartners(list);

            const manager = await getCashbackManagerContract(provider);
            const [base, uShare, rShare, bShare, refBonus] = await Promise.all([
                manager.cashbackBasePercent(),
                manager.userCashbackShare(),
                manager.reserveShare(),
                manager.burnShare(),
                manager.referrerBonusPercent(),
            ]);

            setContractConfig({
                basePercent: Number(base),
                userShare: Number(uShare),
                reserveShare: Number(rShare),
                burnShare: Number(bShare),
                referrerBonus: Number(refBonus),
            });

            if (account) {
                const refId = await manager.getReferrerInfo(account);
                setUserReferrerId(Number(refId));
            }
        } catch (err) {
            console.error("Ошибка загрузки данных из контрактов:", err);
        }

        try {
            const savedUsers = await fetchRegisteredUsers();
            setRegisteredUsers(savedUsers);
        } catch (registryError) {
            console.warn("API реестра пользователей недоступен:", registryError);
            setRegisteredUsers([]);
        }
    }, [account, provider]);

    useEffect(() => {
        if (provider) {
            fetchScapBalance();
            fetchData();
        }
    }, [account, provider, fetchScapBalance, fetchData]);

    const handleMintTokens = async () => {
        if (!signer) {
            setDashboardError(
                "Для минта тестовых токенов нужен подключенный кошелек."
            );
            return;
        }

        setIsLoadingDashboard(true);
        setDashboardError(null);

        try {
            await mintTokens(signer, account, "100");
            setDashboardSuccessMessage(
                "100 тестовых токенов SCAP успешно начислены."
            );
            await fetchScapBalance();
        } catch (err) {
            setDashboardError(
                `Ошибка минта: ${err.reason || err.message || err}`
            );
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    const handleRegisterPartner = async (e) => {
        e.preventDefault();

        if (!signer) {
            alert("Для регистрации партнера нужен подключенный кошелек.");
            return;
        }

        setIsRegisteringPartner(true);

        try {
            const tx = await addPartner(
                signer,
                partnerName,
                partnerDescription,
                referralLink,
                partnerOwnerAddress
            );

            await tx.wait();

            setPartnerName("");
            setPartnerDescription("");
            setReferralLink("");
            setPartnerOwnerAddress("");

            await fetchData();
            alert("Партнер успешно зарегистрирован.");
        } catch (err) {
            alert(`Ошибка: ${err.reason || err.message}`);
        } finally {
            setIsRegisteringPartner(false);
        }
    };

    if (authLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "#0f172a",
                    color: "#818cf8",
                    fontFamily: "sans-serif",
                }}
            >
                <div className="loading-content">
                    <p style={{ fontSize: "1.2rem", letterSpacing: "1px" }}>
                        Загрузка данных платформы...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Панель платформы</h1>
                <p className="subtitle">
                    SCAP, партнеры и локальная база пользователей
                </p>
            </header>

            <div className="dashboard-content">
                <section className="glass-card">
                    <h3>Баланс SCAP</h3>
                    <div className="balance-box">
                        <span className="balance-value">
                            {formatAmount(scapBalance)}
                        </span>
                        <span className="balance-label">SCAP • on-chain</span>
                    </div>
                    <p className="description-text">
                        Токен платформы отображается как <code>SCAP</code> и
                        используется в начислении кешбека и внутренних
                        reward-сценариях.
                    </p>

                    {!canUseBlockchain && (
                        <p className="description-text">
                            Панель открыта в read-only режиме. Просмотр данных
                            доступен без MetaMask, но admin-only действия
                            требуют подключенный кошелек.
                        </p>
                    )}

                    <button
                        onClick={handleMintTokens}
                        disabled={isLoadingDashboard}
                        className="action-button mint"
                    >
                        {isLoadingDashboard
                            ? "Обработка..."
                            : "Получить 100 тестовых токенов SCAP"}
                    </button>

                    {dashboardError && (
                        <p className="msg error">{dashboardError}</p>
                    )}
                    {dashboardSuccessMessage && (
                        <p className="msg success">{dashboardSuccessMessage}</p>
                    )}
                </section>

                <section className="registration-section glass-card">
                    <div className="card-header">
                        <div className="icon-badge">BP</div>
                        <div>
                            <h3>Регистрация бизнес-партнера</h3>
                            <p className="description-text">
                                Зарегистрируйте компанию для участия в
                                экосистеме кешбека
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleRegisterPartner}
                        className="partner-form"
                    >
                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Название компании"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Описание деятельности"
                                value={partnerDescription}
                                onChange={(e) =>
                                    setPartnerDescription(e.target.value)
                                }
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Реферальная ссылка или сайт"
                                value={referralLink}
                                onChange={(e) =>
                                    setReferralLink(e.target.value)
                                }
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input wallet-input"
                                placeholder="Адрес кошелька (0x...)"
                                value={partnerOwnerAddress}
                                onChange={(e) =>
                                    setPartnerOwnerAddress(e.target.value)
                                }
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`submit-btn ${
                                isRegisteringPartner ? "loading" : ""
                            }`}
                            disabled={isRegisteringPartner}
                        >
                            {isRegisteringPartner
                                ? "Регистрация..."
                                : "Зарегистрировать партнера"}
                            <div className="btn-glow"></div>
                        </button>
                    </form>
                </section>

                <section className="glass-card table-card">
                    <h3>Реестр активных партнеров</h3>
                    {allPartners.length === 0 ? (
                        <p className="empty-msg">В реестре пока нет данных.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="partners-table">
                                <thead>
                                    <tr>
                                        <th>Партнер</th>
                                        <th>Кошелек</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPartners.map((partner) => (
                                        <tr key={partner.id}>
                                            <td>
                                                <div className="p-info">
                                                    <span className="p-name">
                                                        {partner.name}
                                                    </span>
                                                    <span className="p-desc">
                                                        {partner.description}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-addr">
                                                {formatWallet(
                                                    partner.partnerWallet
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-tag ${
                                                        partner.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {partner.isActive
                                                        ? "Активен"
                                                        : "Неактивен"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="glass-card table-card">
                    <h3>Локальная база Web3-пользователей</h3>
                    <p className="description-text">
                        Пользователи сохраняются в локальную JSON-базу при
                        подключении кошелька.
                    </p>
                    {registeredUsers.length === 0 ? (
                        <p className="empty-msg">
                            Сохраненных пользователей пока нет. Подключите
                            кошелек, чтобы создать первую запись.
                        </p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="partners-table">
                                <thead>
                                    <tr>
                                        <th>Кошелек</th>
                                        <th>Сеть</th>
                                        <th>Сессии</th>
                                        <th>Последний вход</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registeredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="p-addr">
                                                {formatWallet(
                                                    user.walletAddress
                                                )}
                                            </td>
                                            <td>{user.networkName || "-"}</td>
                                            <td>{user.totalSessions}</td>
                                            <td>
                                                {formatDateTime(user.lastSeenAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {userReferrerId !== 0 && (
                    <section className="glass-card">
                        <h3>Параметры кешбек-модели</h3>
                        <p className="description-text">
                            Базовый кешбек: {contractConfig.basePercent}%,
                            пользователю: {contractConfig.userShare}%, резерву:{" "}
                            {contractConfig.reserveShare}%, сжигание:{" "}
                            {contractConfig.burnShare}%.
                        </p>
                        <p className="description-text">
                            Интерфейс может показывать рублевый эквивалент, но
                            on-chain расчеты выполняются в ETH.
                        </p>
                    </section>
                )}
            </div>

            <style jsx>{`
                .dashboard-container {
                    background:
                        radial-gradient(circle at top right, rgba(217, 53, 53, 0.12), transparent 22%),
                        radial-gradient(circle at top left, rgba(31, 95, 255, 0.18), transparent 28%),
                        #08111f;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px;
                    font-family: "Segoe UI", "Trebuchet MS", sans-serif;
                    color: #f8fafc;
                }

                .dashboard-content {
                    width: 100%;
                    max-width: 600px;
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .dashboard-header {
                    text-align: center;
                    margin-bottom: 28px;
                }

                .dashboard-header h1 {
                    margin: 0 0 10px;
                    font-size: clamp(2.4rem, 5vw, 3.4rem);
                    letter-spacing: -0.04em;
                    color: #f7f9fc;
                }

                .subtitle {
                    max-width: 640px;
                    margin: 0;
                    color: #9bb0d0;
                    line-height: 1.6;
                }

                .glass-card {
                    background: rgba(13, 25, 43, 0.82);
                    backdrop-filter: blur(14px);
                    border: 1px solid rgba(177, 194, 220, 0.14);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: 0 24px 60px rgba(3, 10, 25, 0.32);
                }

                .glass-card h3 {
                    margin-top: 0;
                    margin-bottom: 16px;
                    color: #f7f9fc;
                }

                .card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .icon-badge {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 0.95rem;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    color: #ffffff;
                    background: linear-gradient(
                        135deg,
                        #1f5fff 0%,
                        #1845bf 60%,
                        #d93535 100%
                    );
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
                }

                .description-text {
                    color: #9bb0d0;
                    font-size: 0.92rem;
                    margin-bottom: 16px;
                    line-height: 1.6;
                }

                .description-text code {
                    padding: 2px 6px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    color: #f7f9fc;
                }

                .partner-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .modern-input {
                    width: 100%;
                    background: rgba(6, 14, 27, 0.78);
                    border: 1px solid rgba(177, 194, 220, 0.12);
                    padding: 12px 16px;
                    border-radius: 14px;
                    color: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border 0.3s;
                    box-sizing: border-box;
                }

                .modern-input:focus {
                    border-color: #1f5fff;
                    box-shadow: 0 0 0 3px rgba(31, 95, 255, 0.12);
                }

                .submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(
                        135deg,
                        #1f5fff 0%,
                        #1845bf 60%,
                        #d93535 100%
                    );
                    border: none;
                    border-radius: 14px;
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    opacity: 0.9;
                }

                .balance-box {
                    background: rgba(5, 14, 28, 0.74);
                    border: 1px solid rgba(177, 194, 220, 0.09);
                    border-radius: 18px;
                    padding: 24px;
                    text-align: center;
                    margin-bottom: 15px;
                }

                .balance-value {
                    font-size: 2.4rem;
                    font-weight: 800;
                    color: #f7f9fc;
                }

                .balance-label {
                    margin-left: 10px;
                    color: #9bb0d0;
                }

                .action-button.mint {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid rgba(31, 95, 255, 0.52);
                    color: #cfe0ff;
                    border-radius: 14px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .table-wrapper {
                    overflow-x: auto;
                    margin-top: 15px;
                }

                .empty-msg {
                    margin: 0;
                    color: #c8d3e7;
                }

                .partners-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                .partners-table th {
                    text-align: left;
                    padding: 12px;
                    color: #7f95b5;
                    border-bottom: 1px solid rgba(177, 194, 220, 0.12);
                }

                .partners-table td {
                    padding: 12px;
                    border-bottom: 1px solid rgba(177, 194, 220, 0.06);
                }

                .p-name {
                    display: block;
                    font-weight: 600;
                    color: #f1f5f9;
                }

                .p-desc {
                    font-size: 0.75rem;
                    color: #7f95b5;
                }

                .p-addr {
                    font-family: monospace;
                    color: #cfe0ff;
                }

                .status-tag.active {
                    color: #4ade80;
                }

                .status-tag.inactive {
                    color: #f87171;
                }

                .msg {
                    text-align: center;
                    margin-top: 10px;
                    font-size: 0.85rem;
                }

                .msg.error {
                    color: #f87171;
                }

                .msg.success {
                    color: #4ade80;
                }
            `}</style>
        </div>
    );
}

export default MyDashboard;
