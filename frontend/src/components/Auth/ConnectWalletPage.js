import React, { useState } from "react";
import { useWeb3Auth } from "./Web3AuthContext";
import "../../App.css";
import "./ConnectWalletPage.css";

const EMPTY_FORM = {
    displayName: "",
    email: "",
    password: "",
};

const ConnectWalletPage = () => {
    const {
        authLoading,
        authType,
        connectWallet,
        currentUser,
        error,
        hasWalletInstalled,
        isAuthenticated,
        isWalletConnected,
        login,
        logout,
        register,
        walletLoading,
    } = useWeb3Auth();
    const [mode, setMode] = useState("login");
    const [formState, setFormState] = useState(EMPTY_FORM);
    const [successMessage, setSuccessMessage] = useState("");
    const authModeLabel =
        authType === "hybrid"
            ? "логин + кошелек"
            : authType === "credentials"
              ? "обычная авторизация"
              : authType === "wallet"
                ? "только кошелек"
                : "гость";

    const updateField = (field) => (event) => {
        setFormState((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const resetForm = () => {
        setFormState(EMPTY_FORM);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");

        try {
            if (mode === "register") {
                await register(formState);
                setSuccessMessage(
                    "Аккаунт создан. Теперь вы можете открыть проект с любого браузера без MetaMask."
                );
            } else {
                await login(formState);
                setSuccessMessage("Вход выполнен. Сессия сохранена в браузере.");
            }

            resetForm();
        } catch (submissionError) {
            console.error("Auth submit error:", submissionError);
        }
    };

    const handleConnectWallet = async () => {
        setSuccessMessage("");

        try {
            await connectWallet();
            setSuccessMessage(
                "Кошелек подключен. Теперь доступны on-chain действия."
            );
        } catch (walletError) {
            console.error("Wallet connection error:", walletError);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-layout">
                <section className="auth-card auth-card-primary">
                    <div className="auth-header">
                        <div className="logo">
                            <div className="logo-icon">RM</div>
                            <h1>ShopCAP Access</h1>
                        </div>
                        <p className="auth-subtitle">
                            Добавлен обычный вход без расширений: можно зайти по
                            email и паролю с учебного компьютера или любого
                            браузера. Подключение кошелька остается отдельным
                            шагом только для блокчейн-операций.
                        </p>
                    </div>

                    <div className="auth-tabs" role="tablist">
                        <button
                            type="button"
                            className={`auth-tab ${
                                mode === "login" ? "active" : ""
                            }`}
                            onClick={() => setMode("login")}
                        >
                            Вход
                        </button>
                        <button
                            type="button"
                            className={`auth-tab ${
                                mode === "register" ? "active" : ""
                            }`}
                            onClick={() => setMode("register")}
                        >
                            Регистрация
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {mode === "register" && (
                            <label className="auth-field">
                                <span>Имя</span>
                                <input
                                    type="text"
                                    value={formState.displayName}
                                    onChange={updateField("displayName")}
                                    placeholder="Например, Roman"
                                />
                            </label>
                        )}

                        <label className="auth-field">
                            <span>Email</span>
                            <input
                                type="email"
                                value={formState.email}
                                onChange={updateField("email")}
                                placeholder="name@example.com"
                                required
                            />
                        </label>

                        <label className="auth-field">
                            <span>Пароль</span>
                            <input
                                type="password"
                                value={formState.password}
                                onChange={updateField("password")}
                                placeholder="Минимум 6 символов"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={authLoading}
                        >
                            {authLoading
                                ? "Обработка..."
                                : mode === "register"
                                  ? "Создать аккаунт"
                                  : "Войти в проект"}
                        </button>
                    </form>

                    {successMessage && (
                        <div className="success-message">{successMessage}</div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                </section>

                <section className="auth-card auth-card-secondary">
                    <div className="wallet-panel">
                        <h2>Кошелек для on-chain</h2>
                        <p>
                            Для просмотра проекта теперь достаточно обычной
                            авторизации. Кошелек нужен только там, где требуется
                            подпись транзакции: покупка, минт и админ-действия.
                        </p>

                        <button
                            type="button"
                            onClick={handleConnectWallet}
                            className="auth-button wallet-button"
                            disabled={walletLoading}
                        >
                            {walletLoading
                                ? "Подключение..."
                                : "Подключить MetaMask"}
                        </button>

                        <div className="wallet-note">
                            {hasWalletInstalled
                                ? "Кошелек обнаружен в браузере."
                                : "В этом браузере кошелек не найден. Обычный вход все равно будет работать."}
                        </div>
                    </div>

                    <div className="status-panel">
                        <h3>Статус сессии</h3>
                        {isAuthenticated ? (
                            <div className="status-card">
                                <strong>
                                    {currentUser?.displayName ||
                                        "Пользователь"}
                                </strong>
                                <span>
                                    {currentUser?.email ||
                                        currentUser?.walletAddress ||
                                        "Активная сессия"}
                                </span>
                                <span>Режим: {authModeLabel}</span>
                                <span>
                                    Кошелек:{" "}
                                    {isWalletConnected
                                        ? "подключен"
                                        : "не подключен"}
                                </span>
                                <button
                                    type="button"
                                    className="logout-button"
                                    onClick={() => {
                                        void logout();
                                        setSuccessMessage(
                                            "Сессия завершена."
                                        );
                                    }}
                                >
                                    Выйти из сессии
                                </button>
                            </div>
                        ) : (
                            <div className="status-card">
                                <strong>Гостевой режим</strong>
                                <span>
                                    Маркетплейс доступен для просмотра, а вход
                                    нужен для персонального кабинета и
                                    привычного сценария авторизации.
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ConnectWalletPage;
