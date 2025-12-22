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
import Home from "./components/pages/Home";
import Docs from "./components/pages/Docs";
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
                    <div className="bg-glow-1"></div>
                    <div className="bg-glow-2"></div>

                    {}
                    <header className="hero-welcome">
                        <h1>Welcome to ShopCAP</h1>
                        <p>
                            This is a platform for managing cashback and tokens.
                        </p>
                    </header>

                    <nav className="navbar">
                        <div className="navbar-content">
                            <div className="logo-section">
                                <span className="logo-icon">💎</span>
                                <span className="logo-text">ShopCAP</span>
                            </div>

                            <ul className="nav-links">
                                <li>
                                    <NavLink to="/">Home</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/dashboard">Dashboard</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/docs">Documentation</NavLink>
                                </li>
                            </ul>

                            <div className="nav-actions">
                                <Link
                                    to="/dashboard"
                                    className="btn-primary-sm"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </nav>

                    <main className="content">
                        <Routes>
                            {}
                            {}
                            <Route path="/" element={<Home />} />
                            <Route
                                path="/dashboard"
                                element={<MyDashboard />}
                            />
                            <Route path="/docs" element={<Docs />} />
                        </Routes>
                    </main>

                    <footer className="footer">
                        <p>© 2025 ShopCAP Inc. Built on ICM Blockchain.</p>
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
