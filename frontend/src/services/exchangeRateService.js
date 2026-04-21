import { FALLBACK_ETH_TO_RUB_RATE } from "../utils/locale";

const ETH_RUB_RATE_CACHE_KEY = "shopcap_eth_rub_rate_v1";
const ETH_RUB_RATE_URL =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=rub&include_last_updated_at=true";

function readCachedRate() {
    try {
        const rawValue = localStorage.getItem(ETH_RUB_RATE_CACHE_KEY);

        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue);
        const rate = Number(parsedValue?.rate);
        const updatedAt = Number(parsedValue?.updatedAt);

        if (Number.isNaN(rate)) {
            return null;
        }

        return {
            rate,
            updatedAt: Number.isNaN(updatedAt)
                ? Math.floor(Date.now() / 1000)
                : updatedAt,
            source: parsedValue?.source || "cache",
        };
    } catch (error) {
        return null;
    }
}

function cacheRate(ratePayload) {
    try {
        localStorage.setItem(
            ETH_RUB_RATE_CACHE_KEY,
            JSON.stringify({
                rate: ratePayload.rate,
                updatedAt: ratePayload.updatedAt,
                source: ratePayload.source,
            })
        );
    } catch (error) {
        console.warn("Не удалось сохранить курс ETH/RUB в кеш:", error);
    }
}

export async function getEthRubRate() {
    const headers = {
        Accept: "application/json",
    };

    if (process.env.REACT_APP_COINGECKO_DEMO_API_KEY) {
        headers["x-cg-demo-api-key"] =
            process.env.REACT_APP_COINGECKO_DEMO_API_KEY;
    }

    try {
        const response = await fetch(ETH_RUB_RATE_URL, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const rate = Number(data?.ethereum?.rub);
        const updatedAt = Number(data?.ethereum?.last_updated_at);

        if (Number.isNaN(rate)) {
            throw new Error("В ответе API отсутствует курс ETH/RUB.");
        }

        const result = {
            rate,
            updatedAt: Number.isNaN(updatedAt)
                ? Math.floor(Date.now() / 1000)
                : updatedAt,
            source: "CoinGecko",
            isFallback: false,
        };

        cacheRate(result);
        return result;
    } catch (error) {
        const cachedRate = readCachedRate();

        if (cachedRate) {
            return {
                ...cachedRate,
                isFallback: true,
            };
        }

        return {
            rate: FALLBACK_ETH_TO_RUB_RATE,
            updatedAt: Math.floor(Date.now() / 1000),
            source: "fallback",
            isFallback: true,
        };
    }
}
