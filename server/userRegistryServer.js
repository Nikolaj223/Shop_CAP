const http = require("http");
const path = require("path");
const { promises: fs } = require("fs");
const crypto = require("crypto");

const PORT = Number(process.env.USER_REGISTRY_PORT || 3001);
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");
const MAX_BODY_SIZE = 1024 * 1024;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_STORAGE = {
    users: [],
    authUsers: [],
    authSessions: [],
};

function buildCorsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        ...buildCorsHeaders(),
        "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(payload, null, 2));
}

function sendNoContent(res) {
    res.writeHead(204, buildCorsHeaders());
    res.end();
}

async function ensureStorage() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(
            DATA_FILE,
            JSON.stringify(DEFAULT_STORAGE, null, 2),
            "utf8"
        );
    }
}

function normalizeStorage(parsed) {
    if (!parsed || typeof parsed !== "object") {
        return { ...DEFAULT_STORAGE };
    }

    return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        authUsers: Array.isArray(parsed.authUsers) ? parsed.authUsers : [],
        authSessions: Array.isArray(parsed.authSessions)
            ? parsed.authSessions
            : [],
    };
}

async function readStorage() {
    await ensureStorage();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalizeStorage(JSON.parse(raw));
}

async function writeStorage(storage) {
    await ensureStorage();
    await fs.writeFile(
        DATA_FILE,
        JSON.stringify(normalizeStorage(storage), null, 2),
        "utf8"
    );
}

async function readUsers() {
    const storage = await readStorage();
    return storage.users;
}

async function writeUsers(users) {
    const storage = await readStorage();
    storage.users = users;
    await writeStorage(storage);
}

function normalizeWalletAddress(walletAddress) {
    if (typeof walletAddress !== "string") {
        throw new Error("walletAddress is required");
    }

    const trimmed = walletAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        throw new Error("walletAddress must be a valid EVM address");
    }

    return trimmed;
}

function sanitizeOptionalString(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
}

function normalizeEmail(email) {
    if (typeof email !== "string") {
        throw new Error("email is required");
    }

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error("email must be a valid email address");
    }

    return normalized;
}

function sanitizeDisplayName(value, fallbackEmail) {
    const normalized = sanitizeOptionalString(value);
    if (!normalized) {
        return fallbackEmail.split("@")[0];
    }

    return normalized.slice(0, 60);
}

function validatePassword(password) {
    if (typeof password !== "string" || password.length < 6) {
        throw new Error("password must be at least 6 characters long");
    }

    return password;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
    const actualHash = crypto.scryptSync(password, salt, 64);
    const expectedHashBuffer = Buffer.from(expectedHash, "hex");

    if (actualHash.length !== expectedHashBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(actualHash, expectedHashBuffer);
}

function createSessionToken() {
    return crypto.randomBytes(24).toString("hex");
}

function sanitizeAuthUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        source: user.source || "credentials",
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || null,
    };
}

function cleanupExpiredSessions(storage) {
    const now = Date.now();
    storage.authSessions = storage.authSessions.filter((session) => {
        const lastSeenAt = new Date(
            session.lastSeenAt || session.createdAt || 0
        ).getTime();
        return now - lastSeenAt < SESSION_TTL_MS;
    });
}

async function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let raw = "";

        req.on("data", (chunk) => {
            raw += chunk.toString("utf8");
            if (raw.length > MAX_BODY_SIZE) {
                reject(new Error("Request body is too large"));
                req.destroy();
            }
        });

        req.on("end", () => {
            if (!raw) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(raw));
            } catch {
                reject(new Error("Invalid JSON body"));
            }
        });

        req.on("error", reject);
    });
}

async function upsertUser(payload) {
    const walletAddress = normalizeWalletAddress(payload.walletAddress);
    const walletAddressLower = walletAddress.toLowerCase();
    const chainId = sanitizeOptionalString(payload.chainId);
    const networkName = sanitizeOptionalString(payload.networkName);
    const source = sanitizeOptionalString(payload.source) || "wallet";
    const now = new Date().toISOString();

    const users = await readUsers();
    const existingIndex = users.findIndex(
        (user) => user.walletAddressLower === walletAddressLower
    );

    if (existingIndex >= 0) {
        const existingUser = users[existingIndex];
        const updatedUser = {
            ...existingUser,
            walletAddress,
            chainId,
            networkName,
            source,
            lastSeenAt: now,
            totalSessions: Number(existingUser.totalSessions || 0) + 1,
        };

        users[existingIndex] = updatedUser;
        await writeUsers(users);
        return updatedUser;
    }

    const newUser = {
        id: `user_${Date.now()}`,
        walletAddress,
        walletAddressLower,
        chainId,
        networkName,
        source,
        createdAt: now,
        lastSeenAt: now,
        totalSessions: 1,
    };

    users.unshift(newUser);
    await writeUsers(users);
    return newUser;
}

async function registerAuthUser(payload) {
    const email = normalizeEmail(payload.email);
    const password = validatePassword(payload.password);
    const displayName = sanitizeDisplayName(payload.displayName, email);
    const now = new Date().toISOString();
    const storage = await readStorage();

    cleanupExpiredSessions(storage);

    const existingUser = storage.authUsers.find((user) => user.email === email);
    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const passwordInfo = hashPassword(password);
    const authUser = {
        id: `auth_${Date.now()}`,
        email,
        displayName,
        passwordHash: passwordInfo.hash,
        passwordSalt: passwordInfo.salt,
        source: "credentials",
        createdAt: now,
        lastLoginAt: now,
    };
    const token = createSessionToken();

    storage.authUsers.unshift(authUser);
    storage.authSessions.unshift({
        token,
        userId: authUser.id,
        createdAt: now,
        lastSeenAt: now,
    });

    await writeStorage(storage);

    return {
        token,
        user: sanitizeAuthUser(authUser),
    };
}

async function loginAuthUser(payload) {
    const email = normalizeEmail(payload.email);
    const password = validatePassword(payload.password);
    const now = new Date().toISOString();
    const storage = await readStorage();

    cleanupExpiredSessions(storage);

    const authUser = storage.authUsers.find((user) => user.email === email);
    if (!authUser) {
        throw new Error("User with this email was not found");
    }

    const isPasswordValid = verifyPassword(
        password,
        authUser.passwordSalt,
        authUser.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    authUser.lastLoginAt = now;
    const token = createSessionToken();
    storage.authSessions.unshift({
        token,
        userId: authUser.id,
        createdAt: now,
        lastSeenAt: now,
    });

    await writeStorage(storage);

    return {
        token,
        user: sanitizeAuthUser(authUser),
    };
}

async function restoreAuthSession(payload) {
    const token = sanitizeOptionalString(payload.token);
    if (!token) {
        throw new Error("token is required");
    }

    const now = new Date().toISOString();
    const storage = await readStorage();

    cleanupExpiredSessions(storage);

    const session = storage.authSessions.find((item) => item.token === token);
    if (!session) {
        throw new Error("Session not found");
    }

    const authUser = storage.authUsers.find((user) => user.id === session.userId);
    if (!authUser) {
        storage.authSessions = storage.authSessions.filter(
            (item) => item.token !== token
        );
        await writeStorage(storage);
        throw new Error("User not found");
    }

    session.lastSeenAt = now;
    authUser.lastLoginAt = now;
    await writeStorage(storage);

    return {
        token,
        user: sanitizeAuthUser(authUser),
    };
}

async function logoutAuthSession(payload) {
    const token = sanitizeOptionalString(payload.token);
    if (!token) {
        return;
    }

    const storage = await readStorage();
    storage.authSessions = storage.authSessions.filter(
        (item) => item.token !== token
    );
    await writeStorage(storage);
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

async function handleRequest(req, res) {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
        sendNoContent(res);
        return;
    }

    if (req.method === "GET" && pathname === "/health") {
        sendJson(res, 200, { ok: true, service: "user-registry" });
        return;
    }

    if (req.method === "GET" && pathname === "/api/users") {
        const users = sortUsers(await readUsers());
        sendJson(res, 200, { users, total: users.length });
        return;
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
        const payload = await parseJsonBody(req);
        const result = await registerAuthUser(payload);
        sendJson(res, 201, result);
        return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
        const payload = await parseJsonBody(req);
        const result = await loginAuthUser(payload);
        sendJson(res, 200, result);
        return;
    }

    if (req.method === "POST" && pathname === "/api/auth/session") {
        const payload = await parseJsonBody(req);
        const result = await restoreAuthSession(payload);
        sendJson(res, 200, result);
        return;
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
        const payload = await parseJsonBody(req);
        await logoutAuthSession(payload);
        sendJson(res, 200, { ok: true });
        return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/users/")) {
        const requestedAddress = pathname.replace("/api/users/", "").trim();
        const normalizedAddress = normalizeWalletAddress(requestedAddress);
        const users = await readUsers();
        const user = users.find(
            (item) => item.walletAddressLower === normalizedAddress.toLowerCase()
        );

        if (!user) {
            sendJson(res, 404, { error: "User not found" });
            return;
        }

        sendJson(res, 200, { user });
        return;
    }

    if (
        req.method === "POST" &&
        (pathname === "/api/users" || pathname === "/api/users/upsert")
    ) {
        const payload = await parseJsonBody(req);
        const user = await upsertUser(payload);
        sendJson(res, 200, { user });
        return;
    }

    sendJson(res, 404, { error: "Route not found" });
}

const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
        console.error("User registry server error:", error);
        sendJson(res, 500, { error: error.message || "Internal server error" });
    });
});

server.listen(PORT, async () => {
    await ensureStorage();
    console.log(`User registry API is running on http://localhost:${PORT}`);
    console.log(`Storage file: ${DATA_FILE}`);
});
