import React from "react";

const Docs = () => {
    return (
        <div className="docs-page">
            <div className="docs-container glass-effect">
                <article className="prose">
                    <h1>ShopCAP - документация MVP</h1>

                    <section>
                        <h2>Обзор проекта</h2>
                        <p>
                            ShopCAP - это Web3-маркетплейс с кешбеком в
                            токенах SCAP. Пользователь покупает товар, а
                            система начисляет вознаграждение через
                            смарт-контракты.
                        </p>
                        <ul>
                            <li>
                                <strong>Ключевая идея:</strong> показать
                                работающий сценарий покупки и распределения
                                кешбека на блокчейне
                            </li>
                            <li>
                                <strong>Логика MVP:</strong> фиксированный
                                кешбек, ручное добавление партнеров, рублевый
                                показ цен на витрине с автоматической
                                конвертацией по ETH/RUB курсу и упрощенный
                                пользовательский flow
                            </li>
                            <li>
                                <strong>Назначение:</strong> демонстрация
                                pet-проекта на Solidity с реальным UI
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2>Функциональность</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <h4>Автоматический кешбек</h4>
                                <p>
                                    Контракты рассчитывают и распределяют
                                    награду в токенах SCAP.
                                </p>
                            </div>
                            <div className="feature-card">
                                <h4>Реестр партнеров</h4>
                                <p>
                                    Партнеры регистрируются в on-chain реестре и
                                    используются в логике платформы.
                                </p>
                            </div>
                            <div className="feature-card">
                                <h4>Фиксированная токеномика</h4>
                                <p>
                                    70% пользователю, 20% в резерв и 10% на
                                    сжигание.
                                </p>
                            </div>
                            <div className="feature-card">
                                <h4>Живой курс ETH/RUB</h4>
                                <p>
                                    Пользовательский интерфейс берет текущий
                                    курс через API и показывает товары сразу в
                                    рублях.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2>Технологический стек</h2>
                        <div className="tech-stack">
                            <span>Solidity</span>
                            <span>Ethers.js v6</span>
                            <span>Hardhat</span>
                            <span>OpenZeppelin</span>
                            <span>React 19</span>
                            <span>MetaMask</span>
                        </div>
                    </section>

                    <section>
                        <h2>Быстрый запуск</h2>
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
                    background:
                        radial-gradient(circle at top right, rgba(217, 53, 53, 0.1), transparent 24%),
                        radial-gradient(circle at top left, rgba(31, 95, 255, 0.16), transparent 28%),
                        #08111f;
                    min-height: 100vh;
                }

                .docs-container {
                    max-width: 800px;
                    width: 100%;
                    padding: 40px;
                    border-radius: 28px;
                    text-align: left;
                }

                .glass-effect {
                    background: rgba(13, 25, 43, 0.82);
                    backdrop-filter: blur(14px);
                    border: 1px solid rgba(177, 194, 220, 0.14);
                    box-shadow: 0 24px 60px rgba(3, 10, 25, 0.32);
                }

                .prose h1 {
                    text-align: center;
                    color: #f7f9fc;
                    margin-bottom: 30px;
                    font-size: 2.5rem;
                }

                .prose h2 {
                    border-bottom: 1px solid rgba(177, 194, 220, 0.12);
                    padding-bottom: 10px;
                    margin-top: 30px;
                    color: #f8fafc;
                }

                .prose p,
                .prose li {
                    line-height: 1.6;
                    color: #9bb0d0;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }

                .feature-card {
                    background: rgba(6, 14, 27, 0.72);
                    border: 1px solid rgba(177, 194, 220, 0.1);
                    padding: 18px;
                    border-radius: 16px;
                    font-size: 0.9rem;
                }

                .tech-stack {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .tech-stack span {
                    background: rgba(6, 14, 27, 0.72);
                    border: 1px solid rgba(177, 194, 220, 0.1);
                    padding: 8px 12px;
                    border-radius: 10px;
                    color: #f7f9fc;
                }

                .code-block {
                    background: rgba(3, 8, 17, 0.92);
                    padding: 20px;
                    border-radius: 12px;
                    overflow-x: auto;
                    color: #4ade80;
                }

                @media (max-width: 760px) {
                    .features-grid {
                        grid-template-columns: 1fr;
                    }

                    .docs-container {
                        padding: 28px 22px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Docs;
