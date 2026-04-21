const AUTH_API_BASE =
    process.env.REACT_APP_USER_REGISTRY_API_BASE || "http://localhost:3001";

const AUTH_USERS_STORAGE_KEY = "shopcap.auth.users";
const AUTH_SESSIONS_STORAGE_KEY = "shopcap.auth.sessions";
export const AUTH_TOKEN_STORAGE_KEY = "shopcap.auth.token";

async function readResponse(response) {
    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const error = new Error(
            payload?.error || "Authentication request failed unexpectedly."
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

function readFromStorage(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeToStorage(storageKey, value) {
    localStorage.setItem(storageKey, JSON.stringify(value));
}

function normalizeEmail(email) {
    const normalized = String(email || "")
        .trim()
        .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error("Введите корректный email.");
    }

    return normalized;
}

function normalizeDisplayName(displayName, email) {
    const normalized = String(displayName || "").trim();
    if (normalized) {
        return normalized.slice(0, 60);
    }

    return normalizeEmail(email).split("@")[0];
}

function normalizePassword(password) {
    const normalized = String(password || "");

    if (normalized.length < 6) {
        throw new Error("Пароль должен содержать минимум 6 символов.");
    }

    return normalized;
}

async function hashPasswordForBrowser(password) {
    if (
        typeof window !== "undefined" &&
        window.crypto?.subtle &&
        typeof TextEncoder !== "undefined"
    ) {
        const bytes = new TextEncoder().encode(password);
        const digest = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest))
            .map((value) => value.toString(16).padStart(2, "0"))
            .join("");
    }

    let hash = 0;
    for (let index = 0; index < password.length; index += 1) {
        hash = (hash << 5) - hash + password.charCodeAt(index);
        hash |= 0;
    }

    return `fallback_${Math.abs(hash)}`;
}

function createClientToken() {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        return `browser_${window.crypto.randomUUID()}`;
    }

    return `browser_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeLocalUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        source: user.source || "browser-local",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || null,
    };
}

async function registerInBrowserStorage({ email, password, displayName }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);
    const users = readFromStorage(AUTH_USERS_STORAGE_KEY);
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
        throw new Error("Пользователь с таким email уже существует.");
    }

    const now = new Date().toISOString();
    const user = {
        id: `auth_${Date.now()}`,
        email: normalizedEmail,
        displayName: normalizeDisplayName(displayName, normalizedEmail),
        passwordHash: await hashPasswordForBrowser(normalizedPassword),
        source: "browser-local",
        createdAt: now,
        lastLoginAt: now,
    };
    const token = createClientToken();
    const sessions = readFromStorage(AUTH_SESSIONS_STORAGE_KEY);

    users.unshift(user);
    sessions.unshift({
        token,
        userId: user.id,
        createdAt: now,
        lastSeenAt: now,
    });

    writeToStorage(AUTH_USERS_STORAGE_KEY, users);
    writeToStorage(AUTH_SESSIONS_STORAGE_KEY, sessions);

    return {
        user: sanitizeLocalUser(user),
        token,
    };
}

async function loginInBrowserStorage({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);
    const passwordHash = await hashPasswordForBrowser(normalizedPassword);
    const users = readFromStorage(AUTH_USERS_STORAGE_KEY);
    const user = users.find((item) => item.email === normalizedEmail);

    if (!user || user.passwordHash !== passwordHash) {
        throw new Error("Неверный email или пароль.");
    }

    const now = new Date().toISOString();
    user.lastLoginAt = now;

    const sessions = readFromStorage(AUTH_SESSIONS_STORAGE_KEY);
    const token = createClientToken();
    sessions.unshift({
        token,
        userId: user.id,
        createdAt: now,
        lastSeenAt: now,
    });

    writeToStorage(AUTH_USERS_STORAGE_KEY, users);
    writeToStorage(AUTH_SESSIONS_STORAGE_KEY, sessions);

    return {
        user: sanitizeLocalUser(user),
        token,
    };
}

function restoreInBrowserStorage(token) {
    if (!token) {
        throw new Error("Токен сессии не найден.");
    }

    const sessions = readFromStorage(AUTH_SESSIONS_STORAGE_KEY);
    const users = readFromStorage(AUTH_USERS_STORAGE_KEY);
    const session = sessions.find((item) => item.token === token);

    if (!session) {
        throw new Error("Сессия не найдена.");
    }

    const user = users.find((item) => item.id === session.userId);
    if (!user) {
        throw new Error("Пользователь не найден.");
    }

    const now = new Date().toISOString();
    session.lastSeenAt = now;
    user.lastLoginAt = now;

    writeToStorage(AUTH_SESSIONS_STORAGE_KEY, sessions);
    writeToStorage(AUTH_USERS_STORAGE_KEY, users);

    return {
        user: sanitizeLocalUser(user),
        token,
    };
}

function logoutFromBrowserStorage(token) {
    if (!token) {
        return;
    }

    const sessions = readFromStorage(AUTH_SESSIONS_STORAGE_KEY).filter(
        (item) => item.token !== token
    );
    writeToStorage(AUTH_SESSIONS_STORAGE_KEY, sessions);
}

async function requestAuth(pathname, payload) {
    const response = await fetch(`${AUTH_API_BASE}${pathname}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return readResponse(response);
}

export async function registerWithCredentials(credentials) {
    try {
        return await requestAuth("/api/auth/register", credentials);
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }

        return registerInBrowserStorage(credentials);
    }
}

export async function loginWithCredentials(credentials) {
    try {
        return await requestAuth("/api/auth/login", credentials);
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }

        return loginInBrowserStorage(credentials);
    }
}

export async function restoreCredentialSession(token) {
    if (!token) {
        return null;
    }

    try {
        return await requestAuth("/api/auth/session", { token });
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }

        return restoreInBrowserStorage(token);
    }
}

export async function logoutCredentialSession(token) {
    try {
        await requestAuth("/api/auth/logout", { token });
    } catch (error) {
        if (!isApiUnavailableError(error)) {
            throw error;
        }
    } finally {
        logoutFromBrowserStorage(token);
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
}

export function persistCredentialToken(token) {
    if (!token) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function readPersistedCredentialToken() {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export { AUTH_API_BASE };
