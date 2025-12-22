import React from "react";

const Docs = () => {
    return (
        <div className="docs-container glass-effect">
            <article className="prose">
                <h1>ShopCAP — Consumer Cashback Engine on ICM</h1>

                <section>
                    <h2>🚀 Project Overview</h2>
                    <p>
                        Users earn tokens as cashback whenever they shop from
                        integrated brands.
                    </p>
                    <ul>
                        <li>
                            <strong>Brands pay:</strong> referral commissions,
                            ad placements, feature fees
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
                    <p className="highlight-box">
                        <strong>ICM benefit:</strong> Shopping becomes a
                        revenue-generating financial market.
                    </p>
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
    );
};

export default Docs;
