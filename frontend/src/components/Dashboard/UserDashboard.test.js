import { render, screen } from "@testing-library/react";
import UserDashboard from "./UserDashboard";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import { useEthRubRate } from "../../hooks/useEthRubRate";
import { getDemoScapBalance, getScapBalance } from "../../services/ShopService";

jest.mock("../Auth/Web3AuthContext", () => ({
    useWeb3Auth: jest.fn(),
}));

jest.mock("../../hooks/useEthRubRate", () => ({
    useEthRubRate: jest.fn(),
}));

jest.mock("../../services/ShopService", () => ({
    getDemoScapBalance: jest.fn(),
    getScapBalance: jest.fn(),
}));

describe("UserDashboard", () => {
    beforeEach(() => {
        useWeb3Auth.mockReturnValue({
            account: "0x1234567890123456789012345678901234567890",
            authType: "wallet",
            canUseBlockchain: true,
            connectWallet: jest.fn(),
            currentUser: {
                displayName: "Wallet user",
                walletAddress: "0x1234567890123456789012345678901234567890",
            },
            isAuthenticated: true,
            provider: {},
            userKey: "0x1234567890123456789012345678901234567890",
        });

        useEthRubRate.mockReturnValue({
            ethRubRate: 100000,
        });

        getScapBalance.mockResolvedValue("125");
        getDemoScapBalance.mockReturnValue("0");

        localStorage.setItem(
            "purchases_0x1234567890123456789012345678901234567890",
            JSON.stringify([
                {
                    id: 1,
                    name: "Товар A",
                    price: "0.01",
                    purchaseDate: "2026-04-20T12:00:00.000Z",
                    txHash: "0xabc",
                },
                {
                    id: 2,
                    name: "Товар B",
                    price: "0.02",
                    purchaseDate: "2026-04-20T12:05:00.000Z",
                    txHash: "0xdef",
                },
            ])
        );
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it("shows stored purchases with ruble prices", async () => {
        render(<UserDashboard />);

        expect(await screen.findByText("Товар A")).toBeInTheDocument();
        expect(screen.getByText("Товар B")).toBeInTheDocument();
        expect(screen.getByText(/1[\s\u00A0]?000[\s\u00A0]?₽/)).toBeInTheDocument();
        expect(screen.getByText(/2[\s\u00A0]?000[\s\u00A0]?₽/)).toBeInTheDocument();
    });
});
