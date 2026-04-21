import { useEffect, useState } from "react";
import { getEthRubRate } from "../services/exchangeRateService";
import { FALLBACK_ETH_TO_RUB_RATE } from "../utils/locale";

export function useEthRubRate(refreshIntervalMs = 120000) {
    const [ethRubRate, setEthRubRate] = useState(FALLBACK_ETH_TO_RUB_RATE);
    const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
    const [rateSource, setRateSource] = useState("fallback");
    const [isRateFallback, setIsRateFallback] = useState(true);
    const [isRateLoading, setIsRateLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRate = async () => {
            const ratePayload = await getEthRubRate();

            if (!isMounted) {
                return;
            }

            setEthRubRate(ratePayload.rate);
            setRateUpdatedAt(ratePayload.updatedAt);
            setRateSource(ratePayload.source);
            setIsRateFallback(ratePayload.isFallback);
            setIsRateLoading(false);
        };

        loadRate();
        const intervalId = window.setInterval(loadRate, refreshIntervalMs);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, [refreshIntervalMs]);

    return {
        ethRubRate,
        rateUpdatedAt,
        rateSource,
        isRateFallback,
        isRateLoading,
    };
}
