import { render, screen } from "@testing-library/react";
import Home from "./Home";
import { useWeb3Auth } from "../Auth/Web3AuthContext";
import { useEthRubRate } from "../../hooks/useEthRubRate";
import { fetchAllItems } from "../../services/ShopService";

jest.mock("../Auth/Web3AuthContext", () => ({
    useWeb3Auth: jest.fn(),
}));

jest.mock("../../hooks/useEthRubRate", () => ({
    useEthRubRate: jest.fn(),
}));

jest.mock("../../services/ShopService", () => ({
    buyItemDemo: jest.fn(),
    fetchAllItems: jest.fn(),
    listDemoItem: jest.fn(),
    listItemInPlatform: jest.fn(),
    buyItemSimulated: jest.fn(),
}));

describe("Home page", () => {
    beforeEach(() => {
        useWeb3Auth.mockReturnValue({
            authType: "guest",
            isAuthenticated: false,
            signer: null,
            provider: {},
            userKey: "guest",
        });

        useEthRubRate.mockReturnValue({
            ethRubRate: 100000,
            rateUpdatedAt: 1710000000,
            rateSource: "CoinGecko",
            isRateFallback: false,
            isRateLoading: false,
        });

        fetchAllItems.mockResolvedValue([
            {
                id: 1,
                name: "Тестовый товар",
                price: "0.01",
                priceRaw: "10000000000000000",
                partnerId: 0,
                isActive: true,
            },
        ]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders marketplace prices in rubles", async () => {
        render(<Home />);

        expect(await screen.findByText("Тестовый товар")).toBeInTheDocument();
        expect(screen.getByText(/1[\s\u00A0]?000[\s\u00A0]?₽/)).toBeInTheDocument();
        expect(screen.queryByText(/^0,01 ETH$/)).not.toBeInTheDocument();
    });
});
