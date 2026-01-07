import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
} from "react-router-dom";
import { AuthProvider } from "./components/Auth/Web3AuthContext";
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

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <header className="navbar">
                        <div className="navbar-content">
                            {/* Logo far left */}
                            <Link
                                to="/"
                                className="logo-section"
                                style={{ textDecoration: "none" }}
                            >
                                <span className="logo-icon">💎</span>
                                <span className="logo-text">ShopCAP</span>
                            </Link>

                            {/* The menu is centered */}
                            <ul className="nav-links">
                                <li>
                                    <NavLink to="/">Marketplace</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/user-vault">
                                        My Purchases
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/dashboard">
                                        System Admin
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/docs">Docs</NavLink>
                                </li>
                                {}
                                <li>
                                    <NavLink to="/about">About</NavLink>
                                </li>
                            </ul>

                            {/* Button far right */}
                            <div className="nav-actions">
                                <Link
                                    to="/user-vault"
                                    className="btn-primary-sm"
                                >
                                    My SCAP Wallet
                                </Link>
                            </div>
                        </div>
                    </header>

                    <main className="content">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route
                                path="/user-vault"
                                element={<UserDashboard />}
                            />
                            <Route
                                path="/dashboard"
                                element={<MyDashboard />}
                            />
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
                            © 2026 ShopCAP Protocol. Built for decentralized
                            commerce.
                        </p>
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
