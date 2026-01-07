// components/pages/About.js
import React from "react";

const About = () => {
    return (
        <div className="about-page">
            <div className="about-container glass-effect">
                <article className="prose">
                    <h1>About ShopCAP</h1>

                    <section>
                        <h2>What is ShopCAP?</h2>
                        <p>
                            ShopCAP is a next-generation decentralized cashback
                            engine built on the ICM protocol. Our mission is to
                            turn every-day consumer spending into a productive
                            financial asset by returning value directly to the
                            users.
                        </p>
                    </section>

                    <section className="mechanism-box">
                        <h2>How It Works</h2>
                        <p>
                            When you purchase products through our platform, the
                            protocol automatically triggers a smart contract
                            that calculates and distributes cashback in native
                            SCAP tokens.
                        </p>
                        <div className="distribution-info">
                            <h3>Token Distribution Model:</h3>
                            <ul>
                                <li>
                                    <strong>70% User Rewards:</strong> Sent
                                    directly to your wallet as cashback.
                                </li>
                                <li>
                                    <strong>20% Protocol Reserve:</strong>{" "}
                                    Ensures liquidity and future development.
                                </li>
                                <li>
                                    <strong>10% Burn Mechanism:</strong>{" "}
                                    Permanently removed from supply to maintain
                                    deflationary pressure.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="example-card">
                        <h2>Calculation Example</h2>
                        <div className="example-content">
                            <p>
                                If you purchase an item worth{" "}
                                <strong>1.00 ETH</strong>:
                            </p>
                            <div className="math-row">
                                <span className="label">
                                    Total Cashback generated:
                                </span>
                                <span className="value">
                                    0.1 ETH (approximate 10% rate)
                                </span>
                            </div>
                            <hr />
                            <div className="math-row highlight">
                                <span className="label">
                                    You receive (70%):
                                </span>
                                <span className="value">
                                    0.07 ETH in SCAP Tokens
                                </span>
                            </div>
                            <div className="math-row">
                                <span className="label">
                                    Protocol Reserve (20%):
                                </span>
                                <span className="value">0.02 ETH</span>
                            </div>
                            <div className="math-row">
                                <span className="label">Token Burn (10%):</span>
                                <span className="value">0.01 ETH</span>
                            </div>
                        </div>
                    </section>
                </article>
            </div>

            <style jsx>{`
                .about-page {
                    display: flex;
                    justify-content: center;
                    padding: 40px 20px;
                    min-height: 80vh;
                }

                .about-container {
                    max-width: 800px;
                    width: 100%;
                    padding: 40px;
                    border-radius: 24px;
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                }

                h1 {
                    text-align: center;
                    font-size: 2.5rem;
                    color: #3b82f6;
                    margin-bottom: 30px;
                }

                h2 {
                    color: #818cf8;
                    margin-top: 25px;
                }

                p {
                    line-height: 1.6;
                    color: #94a3b8;
                    font-size: 1.1rem;
                }

                .mechanism-box {
                    background: rgba(15, 23, 42, 0.4);
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                }

                .distribution-info ul {
                    list-style: none;
                    padding: 0;
                }

                .distribution-info li {
                    padding: 10px 0;
                    border-bottom: 1px solid #334155;
                }

                .example-card {
                    margin-top: 40px;
                    border: 1px solid #3b82f6;
                    padding: 25px;
                    border-radius: 20px;
                    background: linear-gradient(
                        145deg,
                        rgba(30, 64, 175, 0.2),
                        rgba(30, 41, 59, 0.5)
                    );
                }

                .math-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                }

                .highlight {
                    color: #4ade80;
                    font-weight: bold;
                    font-size: 1.2rem;
                }

                hr {
                    border: 0;
                    border-top: 1px solid #334155;
                    margin: 15px 0;
                }
            `}</style>
        </div>
    );
};

export default About;
