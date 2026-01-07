import React, { useState, useEffect, useCallback } from "react";
import {
    getPartnerRegistryContract,
    getShopCAPBalance,
    mintTokens,
    addPartner,
    getCashbackManagerContract,
    getAllPartners,
} from "../../services/contractServices";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import "./MyDashboard.css";

function MyDashboard() {
    const { account, provider, signer, loading: authLoading } = useWeb3Auth();

    // --- Token states and general statuses ---
    const [scapBalance, setScapBalance] = useState("0");
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [dashboardSuccessMessage, setDashboardSuccessMessage] =
        useState(null);

    // --- States for partner registration ---
    const [partnerName, setPartnerName] = useState("");
    const [partnerDescription, setPartnerDescription] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [partnerOwnerAddress, setPartnerOwnerAddress] = useState("");
    const [isRegisteringPartner, setIsRegisteringPartner] = useState(false);

    // --- States for simulation of purchases and Money Flow ---
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [purchaseAmount, setPurchaseAmount] = useState(1000);
    const [simulationResult, setSimulationResult] = useState(null);
    const [userReferrerId, setUserReferrerId] = useState(0);

    // Distribution parameters (from CashbackManager)
    const [contractConfig, setContractConfig] = useState({
        basePercent: 1,
        userShare: 70,
        reserveShare: 20,
        burnShare: 10,
        referrerBonus: 0,
    });

    // --- Status of the list of all partners ---
    const [allPartners, setAllPartners] = useState([]);

    /**
     * Loading the SCAP balance
     */
    const fetchScapBalance = useCallback(async () => {
        if (account && provider) {
            try {
                const balance = await getShopCAPBalance(provider, account);
                setScapBalance(balance);
            } catch (err) {
                console.error("Error fetching SCAP balance:", err);
            }
        }
    }, [account, provider]);

    const fetchData = useCallback(async () => {
        if (!provider) return;
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
            console.error("Error fetching data from contracts:", err);
        }
    }, [account, provider]);

    useEffect(() => {
        if (provider) {
            fetchScapBalance();
            fetchData();
        }
    }, [account, provider, fetchScapBalance, fetchData]);

    const handleMintTokens = async () => {
        if (!signer) return;
        setIsLoadingDashboard(true);
        setDashboardError(null);
        try {
            await mintTokens(signer, account, "100");
            setDashboardSuccessMessage("100 SCAP minted successfully!");
            await fetchScapBalance();
        } catch (err) {
            setDashboardError(`Minting error: ${err.reason || err.message}`);
        } finally {
            setIsLoadingDashboard(false);
        }
    };
    const handleRegisterPartner = async (e) => {
        e.preventDefault();
        if (!signer) return;
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
            alert("Partner registered successfully!");
        } catch (err) {
            alert(`Error: ${err.reason || err.message}`);
        } finally {
            setIsRegisteringPartner(false);
        }
    };

    const runPurchaseSimulation = () => {
        if (!selectedPartnerId) return alert("Select a partner");

        // CashbackManager.issueCashbackAndDistribute()
        const totalCashback =
            (purchaseAmount * contractConfig.basePercent) / 100;

        let userAmount = (totalCashback * contractConfig.userShare) / 100;
        const reserveAmount =
            (totalCashback * contractConfig.reserveShare) / 100;
        const burnAmount = (totalCashback * contractConfig.burnShare) / 100;

        let referrerAmount = 0;
        if (contractConfig.referrerBonus > 0 && userReferrerId !== 0) {
            referrerAmount = (userAmount * contractConfig.referrerBonus) / 100;
            userAmount = userAmount - referrerAmount;
        }

        setSimulationResult({
            total: totalCashback,
            user: userAmount,
            reserve: reserveAmount,
            burn: burnAmount,
            referrer: referrerAmount,
            refId: userReferrerId,
        });
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
                        Uploading asset data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {}
            <header className="dashboard-header">
                <h1>Platform Ecosystem</h1>
                <p className="subtitle">
                    SCAP asset management and partner status
                </p>
            </header>

            <div className="dashboard-content">
                {/* BLOCK 1: SCAP Balance */}
                <section className="glass-card">
                    <h3>My SCAP Assets</h3>
                    <div className="balance-box">
                        <span className="balance-value">{scapBalance}</span>
                        <span className="balance-label">SCAP</span>
                    </div>

                    <button
                        onClick={handleMintTokens}
                        disabled={isLoadingDashboard}
                        className="action-button mint"
                    >
                        {isLoadingDashboard
                            ? "Processing..."
                            : "Get 100 SCAP test scores"}
                    </button>

                    {dashboardError && (
                        <p className="msg error">{dashboardError}</p>
                    )}
                    {dashboardSuccessMessage && (
                        <p className="msg success">{dashboardSuccessMessage}</p>
                    )}
                </section>

                {/* BLOCK 2: Registration (Returned and styled block) */}
                <section className="registration-section glass-card">
                    <div className="card-header">
                        <div className="icon-badge">🤝</div>
                        <h3>Become a business partner</h3>
                        <p className="description-text">
                            Register a company to participate in the ecosystem
                            of cashback
                        </p>
                    </div>

                    <form
                        onSubmit={handleRegisterPartner}
                        className="partner-form"
                    >
                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Company name"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Description of the activity"
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
                                placeholder="Referral link or website"
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
                                placeholder="Wallet address (0x...)"
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
                                ? "Registration..."
                                : "Register a partner"}
                            <div className="btn-glow"></div>
                        </button>
                    </form>
                </section>

                {/* BLOCK 3: Partner Registry */}
                <section className="glass-card table-card">
                    <h3>Register of active partners</h3>
                    {allPartners.length === 0 ? (
                        <p className="empty-msg">
                            There is no data in the registry yet.
                        </p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="partners-table">
                                <thead>
                                    <tr>
                                        <th>Partner</th>
                                        <th>Wallet</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPartners.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="p-info">
                                                    <span className="p-name">
                                                        {p.name}
                                                    </span>
                                                    <span className="p-desc">
                                                        {p.description}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-addr">
                                                {`${p.partnerWallet.slice(
                                                    0,
                                                    6
                                                )}...${p.partnerWallet.slice(
                                                    -4
                                                )}`}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-tag ${
                                                        p.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {p.isActive
                                                        ? "● Active"
                                                        : "○ Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
                .dashboard-container {
                    background: #0f172a;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px;
                    font-family: "Inter", sans-serif;
                    color: #f8fafc;
                }

                .dashboard-content {
                    width: 100%;
                    max-width: 600px;
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .glass-card {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                }

                .card-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .icon-badge {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
                .description-text {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }

                .partner-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .modern-input {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 12px 16px;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border 0.3s;
                    box-sizing: border-box;
                }

                .modern-input:focus {
                    border-color: #6366f1;
                }

                .submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(
                        135deg,
                        #6366f1 0%,
                        #a855f7 100%
                    );
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
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
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 15px;
                }
                .balance-value {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #818cf8;
                }
                .balance-label {
                    margin-left: 10px;
                    color: #94a3b8;
                }

                .action-button.mint {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid #6366f1;
                    color: #818cf8;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .table-wrapper {
                    overflow-x: auto;
                    margin-top: 15px;
                }
                .partners-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                .partners-table th {
                    text-align: left;
                    padding: 12px;
                    color: #64748b;
                    border-bottom: 1px solid #334155;
                }
                .partners-table td {
                    padding: 12px;
                    border-bottom: 1px solid #1e293b;
                }
                .p-name {
                    display: block;
                    font-weight: 600;
                    color: #f1f5f9;
                }
                .p-desc {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .p-addr {
                    font-family: monospace;
                    color: #818cf8;
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
