export function formatAmount(value, maximumFractionDigits = 4) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return value;
    }

    return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(numericValue);
}

export const FALLBACK_ETH_TO_RUB_RATE = 177414;

export function formatEth(value) {
    return `${formatAmount(value, 6)} ETH`;
}

export function formatRub(value) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return value;
    }

    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericValue);
}

export function convertEthToRub(ethValue, ethRubRate = FALLBACK_ETH_TO_RUB_RATE) {
    const numericValue = Number(ethValue);
    const numericRate = Number(ethRubRate);

    if (Number.isNaN(numericValue) || Number.isNaN(numericRate)) {
        return null;
    }

    return numericValue * numericRate;
}

export function convertRubToEth(rubValue, ethRubRate = FALLBACK_ETH_TO_RUB_RATE) {
    const numericValue = Number(rubValue);
    const numericRate = Number(ethRubRate);

    if (
        Number.isNaN(numericValue) ||
        Number.isNaN(numericRate) ||
        numericRate === 0
    ) {
        return null;
    }

    return numericValue / numericRate;
}

export function formatRubFromEth(
    ethValue,
    ethRubRate = FALLBACK_ETH_TO_RUB_RATE
) {
    const rubValue = convertEthToRub(ethValue, ethRubRate);

    if (rubValue === null) {
        return "-";
    }

    return formatRub(rubValue);
}

export function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ru-RU");
}

export function formatWallet(address) {
    if (!address) {
        return "-";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
