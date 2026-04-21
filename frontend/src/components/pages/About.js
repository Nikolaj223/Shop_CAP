import React from "react";

const About = () => {
    return (
        <div className="about-page">
            <div className="about-container glass-effect">
                <article className="prose">
                    <h1>О проекте ShopCAP</h1>

                    <section>
                        <h2>Что такое ShopCAP?</h2>
                        <p>
                            ShopCAP - это MVP маркетплейса с токенизированным
                            кешбеком. Проект показывает, как покупки
                            пользователя могут запускать on-chain логику и
                            превращаться в прозрачное распределение ценности.
                        </p>
                    </section>

                    <section className="mechanism-box">
                        <h2>Как это работает</h2>
                        <p>
                            После покупки товара через платформу смарт-контракт
                            рассчитывает кешбек и распределяет токены
                            <strong> SCAP</strong> между пользователем,
                            резервом платформы и механизмом сжигания.
                        </p>
                        <div className="distribution-info">
                            <h3>Модель распределения:</h3>
                            <ul>
                                <li>
                                    <strong>70% пользователю:</strong> кешбек
                                    начисляется прямо на кошелек.
                                </li>
                                <li>
                                    <strong>20% резерву платформы:</strong>{" "}
                                    часть награды сохраняется внутри
                                    экосистемы.
                                </li>
                                <li>
                                    <strong>10% на сжигание:</strong> доля
                                    награды отправляется на burn address.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="example-card">
                        <h2>Пример расчета</h2>
                        <div className="example-content">
                            <p>
                                Если пользователь совершает покупку на{" "}
                                <strong>10 000 ₽</strong>:
                            </p>
                            <div className="math-row">
                                <span className="label">Кешбек-пул:</span>
                                <span className="value">100 ₽</span>
                            </div>
                            <hr />
                            <div className="math-row highlight">
                                <span className="label">
                                    Пользователь получает (70%):
                                </span>
                                <span className="value">
                                    70 ₽ в токенах SCAP
                                </span>
                            </div>
                            <div className="math-row">
                                <span className="label">
                                    Резерв платформы (20%):
                                </span>
                                <span className="value">20 ₽</span>
                            </div>
                            <div className="math-row">
                                <span className="label">
                                    Сжигание токенов (10%):
                                </span>
                                <span className="value">10 ₽</span>
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
                    background:
                        radial-gradient(circle at top right, rgba(217, 53, 53, 0.1), transparent 24%),
                        radial-gradient(circle at top left, rgba(31, 95, 255, 0.16), transparent 28%),
                        #08111f;
                    min-height: 80vh;
                }

                .about-container {
                    max-width: 800px;
                    width: 100%;
                    padding: 40px;
                    border-radius: 28px;
                    background: rgba(13, 25, 43, 0.82);
                    backdrop-filter: blur(14px);
                    border: 1px solid rgba(177, 194, 220, 0.14);
                    color: #f8fafc;
                    box-shadow: 0 24px 60px rgba(3, 10, 25, 0.32);
                }

                h1 {
                    text-align: center;
                    font-size: 2.5rem;
                    color: #f7f9fc;
                    margin-bottom: 30px;
                }

                h2 {
                    color: #dce6f6;
                    margin-top: 25px;
                }

                p {
                    line-height: 1.6;
                    color: #9bb0d0;
                    font-size: 1.1rem;
                }

                .mechanism-box {
                    background: rgba(6, 14, 27, 0.72);
                    padding: 20px;
                    border-radius: 18px;
                    border: 1px solid rgba(177, 194, 220, 0.1);
                    margin: 20px 0;
                }

                .distribution-info ul {
                    list-style: none;
                    padding: 0;
                }

                .distribution-info li {
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(177, 194, 220, 0.08);
                }

                .example-card {
                    margin-top: 40px;
                    border: 1px solid rgba(177, 194, 220, 0.14);
                    padding: 25px;
                    border-radius: 22px;
                    background: linear-gradient(
                        145deg,
                        rgba(31, 95, 255, 0.16),
                        rgba(13, 25, 43, 0.84) 52%,
                        rgba(217, 53, 53, 0.12)
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
                    border-top: 1px solid rgba(177, 194, 220, 0.1);
                    margin: 15px 0;
                }

                @media (max-width: 760px) {
                    .about-container {
                        padding: 28px 22px;
                    }

                    .math-row {
                        flex-direction: column;
                        gap: 6px;
                    }
                }
            `}</style>
        </div>
    );
};

export default About;
