// src/components/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="home-page">
            <h1>Welcome to ShopCAP</h1>
            <p>This is a platform for managing cashback and tokens.</p>

            {/* Link button to MyDashboard */}
            <Link to="/dashboard" className="start-earning-button">
                {/* Get Started */}
            </Link>
        </div>
    );
}

export default Home;
