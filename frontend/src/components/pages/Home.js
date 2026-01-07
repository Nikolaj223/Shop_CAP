import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import {
    fetchAllItems,
    listItemInPlatform,
    buyItemSimulated,
} from "../../services/ShopService";
import "./Home.css";

function Home() {
    const { signer, provider } = useWeb3Auth();
    const [isPending, setIsPending] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);

    // State for storing items downloaded from the blockchain
    const [brands, setBrands] = useState([]);

    // New state for the form (added partnerId)
    const [newBrand, setNewBrand] = useState({
        name: "",
        category: "General",
        price: "0.01",
        emoji: "📦",
        partnerId: "0",
    });
    /**
     * Loading products from a smart contract
     */
    const loadBlockchainData = async () => {
        if (!provider) return;
        try {
            // Use the service to get a list of all products on the platform
            const items = await fetchAllItems(provider);

            // Mapping the contract data to the design of our cards
            const formattedItems = items.map((item) => ({
                id: item.id,
                name: item.name,
                cat: "Blockchain Item",
                price: item.price,
                priceRaw: item.priceRaw,
                partnerId: item.partnerId,
                img: "💎",
                isActive: item.isActive,
            }));

            setBrands(formattedItems.filter((i) => i.isActive));
        } catch (err) {
            console.error("Error loading products:", err);
        }
    };

    useEffect(() => {
        loadBlockchainData();
    }, [provider]);

    /**
     * Creating a new product on the platform
     */
    const handleAddAndMint = async (e) => {
        e.preventDefault();
        if (!signer) return alert("Connect the wallet!");

        setIsPending(true);
        try {
            await listItemInPlatform(
                signer,
                newBrand.name,
                newBrand.price,
                100,
                newBrand.partnerId
            );

            alert("The product was successfully created in the blockchain!");
            setNewBrand({
                name: "",
                category: "General",
                price: "0.01",
                emoji: "📦",
                partnerId: "0",
            });
            setShowAdmin(false);

            await loadBlockchainData();
        } catch (err) {
            console.error(err);
            alert("Creation error: " + (err.reason || err.message));
        } finally {
            setIsPending(false);
        }
    };

    const handleBuy = async (brand) => {
        if (!signer) return alert("Connect your wallet!");

        setIsPending(true);
        try {
            const result = await buyItemSimulated(signer, brand);

            if (result.success) {
                const userAddress = await signer.getAddress();

                const storageKey = `purchases_${userAddress.toLowerCase()}`;
                const currentPurchasedRaw = localStorage.getItem(storageKey);
                const currentPurchases = currentPurchasedRaw
                    ? JSON.parse(currentPurchasedRaw)
                    : [];

                const newPurchase = {
                    ...brand,
                    txHash: result.hash,
                    purchaseDate: new Date().toLocaleString(),
                    status: "Cashback Received",
                };

                localStorage.setItem(
                    storageKey,
                    JSON.stringify([...currentPurchases, newPurchase])
                );

                alert(
                    `Success! The cashback has been credited to your wallet. Purchase amount: ${brand.price} ETH`
                );
            }
        } catch (error) {
            console.error("Purchase error:", error);
            alert(error.reason || error.message || "Transaction error");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="home-page">
            <header className="hero-section">
                <h1>Web3 Cashback Marketplace</h1>
                <p>Buy products and receive ShopCAP tokens instantly</p>
                <button
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="btn-main"
                >
                    {showAdmin ? "Close the panel" : "Add your product"}
                </button>
            </header>

            {showAdmin && (
                <div className="admin-panel">
                    <h3>Create a product on the Platform</h3>
                    <form
                        onSubmit={handleAddAndMint}
                        className="add-brand-form"
                    >
                        <input
                            type="text"
                            placeholder="Product Name"
                            value={newBrand.name}
                            onChange={(e) =>
                                setNewBrand({
                                    ...newBrand,
                                    name: e.target.value,
                                })
                            }
                            required
                        />
                        <input
                            type="number"
                            step="0.0001"
                            placeholder="Price in ETH (for calculating cashback)"
                            value={newBrand.price}
                            onChange={(e) =>
                                setNewBrand({
                                    ...newBrand,
                                    price: e.target.value,
                                })
                            }
                            required
                        />
                        <input
                            type="number"
                            placeholder="Partner's ID (0 if not)"
                            value={newBrand.partnerId}
                            onChange={(e) =>
                                setNewBrand({
                                    ...newBrand,
                                    partnerId: e.target.value,
                                })
                            }
                        />
                        <button
                            type="submit"
                            className="btn-main btn-create"
                            disabled={isPending}
                        >
                            {isPending ? "Create..." : "Write to Blockchain"}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid-container">
                {brands.length > 0 ? (
                    brands.map((brand) => (
                        <div key={brand.id} className="brand-card nft-style">
                            <div className="card-media">
                                <span className="brand-icon">{brand.img}</span>
                            </div>
                            <div className="card-content">
                                <div className="card-header">
                                    <h3>{brand.name}</h3>
                                    <span className="category-tag">
                                        {brand.cat}
                                    </span>
                                </div>
                                <div className="price-section">
                                    <div className="price-label">
                                        Virtual price
                                    </div>
                                    <div className="price-value">
                                        {brand.price} ETH
                                    </div>
                                </div>
                                <button
                                    className="btn-main btn-buy"
                                    onClick={() => handleBuy(brand)}
                                    disabled={isPending}
                                >
                                    {isPending ? "Processing..." : "Buy"}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-items">
                        No products found. Create the first product
                    </p>
                )}
            </div>
        </div>
    );
}

export default Home;
