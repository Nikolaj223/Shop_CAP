import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import { getScapBalance } from "../../services/ShopService";
import "./UserDashboard.css";

const UserDashboard = () => {
    const { account, provider } = useWeb3Auth();
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [scapBalance, setScapBalance] = useState("0");
    const [loading, setLoading] = useState(true);

    const fetchBalance = async () => {
        if (provider && account) {
            try {
                const balance = await getScapBalance(provider, account);
                setScapBalance(balance);
            } catch (err) {
                console.error("Error when receiving the balance:", err);
            }
        }
    };

    const loadPurchasedItems = () => {
        if (account) {
            const storageKey = `purchases_${account.toLowerCase()}`;
            const savedPurchases = localStorage.getItem(storageKey);
            if (savedPurchases) {
                setPurchasedItems(JSON.parse(savedPurchases));
            } else {
                setPurchasedItems([]);
            }
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            if (account) {
                await fetchBalance();
                loadPurchasedItems();
            }
            setLoading(false);
        };
        initDashboard();
    }, [account, provider]);

    if (loading)
        return <div className="loading">Uploading profile data...</div>;

    return (
        <div className="dashboard-container">
            <div className="balance-card">
                <div className="balance-info">
                    <p>Your Token balance (Cashback)</p>
                    <h1>{scapBalance} SCAP</h1>
                    <small>Account:{account}</small>
                </div>
                {/* <button className="btn-refresh" onClick={fetchBalance}>
                    🔄 Update
                </button> */}
            </div>

            <h2 style={{ margin: "30px 0 20px" }}>📦 My purchased items</h2>

            {purchasedItems.length === 0 ? (
                <div className="empty-state">
                    <p>
                        You don't have any transaction history yet. Purchase the
                        product on the main page.
                    </p>
                </div>
            ) : (
                <div className="market-grid">
                    {purchasedItems.map((item, index) => (
                        <div
                            key={index}
                            className="product-card purchased shadow-pulse"
                        >
                            <div className="status-badge">
                                Cashback received
                            </div>
                            <div
                                style={{
                                    fontSize: "3.5rem",
                                    marginBottom: "10px",
                                }}
                            >
                                {item.img}
                            </div>
                            <h3>{item.name}</h3>
                            <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                                {item.purchaseDate}
                            </p>
                            <div
                                style={{
                                    marginTop: "15px",
                                    fontWeight: "bold",
                                }}
                            >
                                <span
                                    style={{
                                        color: "#10b981",
                                        fontSize: "1.2rem",
                                    }}
                                >
                                    {item.price} ETH
                                </span>
                            </div>
                            {item.txHash && (
                                <div
                                    className="tx-link"
                                    style={{ marginTop: "10px" }}
                                >
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            color: "#6366f1",
                                            fontSize: "0.7rem",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        View in Etherscan
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
