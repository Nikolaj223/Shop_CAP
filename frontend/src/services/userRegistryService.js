const USER_REGISTRY_API_BASE =
    process.env.REACT_APP_USER_REGISTRY_API_BASE || "http://localhost:3001";

const WALLET_USERS_STORAGE_KEY = "shopcap.wallet.users";

async function readResponse(response) {
    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const error = new Error(
            payload?.error || "User registry request failed unexpectedly."
        );
        error.status = response.status;
        throw error;
    }

    return payload;
}

function isApiUnavailableError(error) {
    return (
        error?.status === 404 ||
        error?.name === "TypeError" ||
        /failed to fetch/i.test(String(error?.message || ""))
    );
}

function readWalletUsersFromStorage() {
    try {
        const raw = localStorage.getItem(WALLET_USERS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeWalletUsersToStorage(users) {
    localStorage.setItem(WALLET_USERS_STORAGE_KEY, JSON.stringify(users));
}

function normalizeWalletAddress(walletAddress) {
    const normalized = String(walletAddress || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
        throw new Error("walletAddress must be a valid EVM address");
    }

    return normalized;
}

function upsertUserInBrowserStorage({
    walletAddress,
    chainId,
    networkName,
    source = "metamask",
}) {
    const normalizedAddress = normalizeWalletAddress(walletAddress);
    const walletAddressLower = normalizedAddress.toLowerCase();
    const now = new Date().toISOString();
    const users = readWalletUsersFromStorage();
    const existingIndex = users.findIndex(
        (user) => user.walletAddressLower === walletAddressLower
    );

    if (existingIndex >= 0) {
        const existingUser = users[existingIndex];
        const updatedUser = {
            ...existingUser,
            walletAddress: normalizedAddress,
            chainId: chainId ? String(chainId) : null,
            networkName: networkName || null,
            source,
            lastSeenAt: now,
            totalSessions: Number(existingUser.totalSessions || 0) + 1,
        };

        users[existingIndex] = updatedUser;
        writeWalletUsersToStorage(users);
        return updatedUser;
    }

    const newUser = {
        id: `wallet_${Date.now()}`,
        walletAddress: normalizedAddress,
        walletAddressLower,
        chainId: chainId ? String(chainId) : null,
        networkName: networkName || null,
        source,
        createdAt: now,
        lastSeenAt: now,
        totalSessions: 1,
    };

    users.unshift(newUser);
    writeWalletUsersToStorage(users);
    return newUser;
}

function sortUsers(users) {
    return [...users].sort((left, right) => {
        const leftTime = new Date(left.lastSeenAt || left.createdAt || 0).getTime();
        const rightTime = new Date(
            right.lastSeenAt || right.createdAt || 0
        ).getTime();
        return rightTime - leftTime;
    });
}

export async function upsertConnectedUser({
    walletAddress,
    chainId,
    networkName,
    source = "metamask",
}) {
    try {
        const response = await fetch(`${USER_REGISTRY_API_BASE}/api/users/upsert`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                walletAddress,
                chainId,
                networkName,
                source,
            }),
        });

        const payload = await readResponse(response);
        return payload.user;
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }

        return upsertUserInBrowserStorage({
            walletAddress,
            chainId,
            networkName,
            source,
        });
    }
}

export async function fetchRegisteredUsers() {
    try {
        const response = await fetch(`${USER_REGISTRY_API_BASE}/api/users`);
        const payload = await readResponse(response);
        return payload.users || [];
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }

        return sortUsers(readWalletUsersFromStorage());
    }
}

export { USER_REGISTRY_API_BASE };
