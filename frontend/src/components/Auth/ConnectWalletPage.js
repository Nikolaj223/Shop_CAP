// src/components/Auth/ConnectWalletPage.js
import React, { useContext } from "react";
import { AuthContext } from "./Web3AuthContext"; // Используем новый Web3AuthContext
import "../../App.css"; // Импортируем общие стили приложения
import "./ConnectWalletPage.css"; // Создаем и импортируем файл для стилей этой страницы

const ConnectWalletPage = () => {
    const { connectWallet, loading, error } = useContext(AuthContext);

    const handleConnect = () => {
        connectWallet();
    };

    return (
        // Используем класс 'auth-container', который будет определен в 'ConnectWalletPage.css'
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo">
                            <div className="logo-icon">SC</div>
                            <h1>ShopCAP</h1>
                        </div>
                        <p className="auth-subtitle">
                            Подключите ваш Web3 кошелек, чтобы получить доступ к
                            платформе.
                        </p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        onClick={handleConnect}
                        // Класс 'auth-button' и 'large' должны быть определены в 'App.css'
                        // или в 'ConnectWalletPage.css' для корректного отображения кнопки.
                        className="auth-button large"
                        disabled={loading}
                    >
                        {loading ? "Подключение..." : "Подключить кошелек"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectWalletPage;
