import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
} from "react-router-dom";
import { AuthProvider, useWeb3Auth } from "./components/Auth/Web3AuthContext";
import ConnectWalletPage from "./components/Auth/ConnectWalletPage";
import MyDashboard from "./components/Dashboard/MyDashboard";
import UserDashboard from "./components/Dashboard/UserDashboard";
import Home from "./components/pages/Home";
import Docs from "./components/pages/Docs";
import About from "./components/pages/About";
import "./App.css";

const NavLink = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className={`nav-link ${isActive ? "active" : ""}`}>
            {children}
        </Link>
    );
};

const SessionActions = () => {
    const { isAuthenticated, logout } = useWeb3Auth();

    if (!isAuthenticated) {
        return (
            <div className="nav-actions">
                <Link to="/auth" className="btn-secondary-sm">
                    Войти
                </Link>
                <Link to="/user-vault" className="btn-primary-sm">
                    Личный кабинет
                </Link>
            </div>
        );
    }

    return (
        <div className="nav-actions">
            <Link to="/user-vault" className="btn-primary-sm">
                Кабинет
            </Link>
            <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => {
                    void logout();
                }}
            >
                Выйти
            </button>
        </div>
    );
};

function AppShell() {
    return (
        <div className="app-container">
            <header className="navbar">
                <div className="navbar-content">
                    <Link
                        to="/"
                        className="logo-section"
                        style={{ textDecoration: "none" }}
                    >
                        <span className="logo-icon">RM</span>
                        <span className="logo-text">ShopCAP</span>
                    </Link>

                    <ul className="nav-links">
                        <li>
                            <NavLink to="/">Маркетплейс</NavLink>
                        </li>
                        <li>
                            <NavLink to="/user-vault">Мои покупки</NavLink>
                        </li>
                        <li>
                            <NavLink to="/dashboard">Админ-панель</NavLink>
                        </li>
                        <li>
                            <NavLink to="/auth">Вход</NavLink>
                        </li>
                        <li>
                            <NavLink to="/docs">Документация</NavLink>
                        </li>
                        <li>
                            <NavLink to="/about">О проекте</NavLink>
                        </li>
                    </ul>

                    <SessionActions />
                </div>
            </header>

            <main className="content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<ConnectWalletPage />} />
                    <Route path="/user-vault" element={<UserDashboard />} />
                    <Route path="/dashboard" element={<MyDashboard />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/docs" element={<Docs />} />
                </Routes>
            </main>

            <footer
                className="footer"
                style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#475569",
                }}
            >
                <p>
                    (c) 2026 ShopCAP Protocol. Маркетплейс с кешбеком в токенах
                    SCAP.
                </p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppShell />
            </Router>
        </AuthProvider>
    );
}

export default App;
