import React from "react";

const Docs = () => {
    return (
        <div className="docs-page">
            {" "}
            {}
            <div className="docs-container glass-effect">
                <article className="prose">
                    <h1>ShopCAP — Consumer Cashback Engine on ICM</h1>

                    <section>
                        <h2>🚀 Project Overview</h2>
                        <p>
                            Users earn tokens as cashback whenever they shop
                            from integrated brands.
                        </p>
                        <ul>
                            <li>
                                <strong>Brands pay:</strong> referral
                                commissions, ad placements, feature fees
                            </li>
                            <li>
                                <strong>Cashflow:</strong> routed into the token
                                economy.
                            </li>
                            <li>
                                <strong>Token utility:</strong> upgrade cashback
                                multipliers, vote on brand integrations.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2>✨ Features</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <h4>Automated Cashback</h4>
                                <p>
                                    Smart contract logic for calculating and
                                    distributing rewards in ERC-20 tokens.
                                </p>
                            </div>
                            <div className="feature-card">
                                <h4>Transparent Registry</h4>
                                <p>
                                    Decentralized directory of verified partners
                                    managed on-chain.
                                </p>
                            </div>
                            <div className="feature-card">
                                <h4>Fixed Tokenomics</h4>
                                <p>
                                    70% Cashback, 20% Reserve, 10% Deflationary
                                    burning.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2>🛠️ Technologies Used</h2>
                        <div className="tech-stack">
                            <span>Solidity</span> <span>Ethers.js v6</span>{" "}
                            <span>Hardhat</span>
                            <span>OpenZeppelin</span> <span>React 19</span>{" "}
                            <span>Glassmorphism</span>
                        </div>
                    </section>

                    <section>
                        <h2>⚙️ Installation</h2>
                        <pre className="code-block">
                            <code>{`git clone https://github.com/Nikolaj223/ShopCAP.git\nnpm install\nnpm start`}</code>
                        </pre>
                    </section>
                </article>
            </div>
            <style jsx>{`
                .docs-page {
                    display: flex;
                    justify-content: center;
                    padding: 40px 20px;
                    background: #0f172a;
                    min-height: 100vh;
                }

                .docs-container {
                    max-width: 800px;
                    width: 100%;
                    padding: 40px;
                    border-radius: 24px;
                    text-align: left;
                }

                .glass-effect {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                }

                .prose h1 {
                    text-align: center;
                    color: #818cf8;
                    margin-bottom: 30px;
                    font-size: 2.5rem;
                }

                .prose h2 {
                    border-bottom: 1px solid #334155;
                    padding-bottom: 10px;
                    margin-top: 30px;
                    color: #f8fafc;
                }

                .prose p,
                .prose li {
                    line-height: 1.6;
                    color: #94a3b8;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-top: 20px;
                }

                .feature-card {
                    background: rgba(15, 23, 42, 0.5);
                    padding: 15px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                }

                .code-block {
                    background: #000;
                    padding: 20px;
                    border-radius: 12px;
                    overflow-x: auto;
                    color: #4ade80;
                }
            `}</style>
        </div>
    );
};

export default Docs;
