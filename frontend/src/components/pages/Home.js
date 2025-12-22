// src/components/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="home-page">
            <h1></h1>
            <p></p>

            {/* Link button to MyDashboard */}
            <Link to="/dashboard" className="start-earning-button">
                {/* Get Started */}
            </Link>
        </div>
    );
}

export default Home;
