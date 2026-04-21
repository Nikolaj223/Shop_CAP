import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { BrowserProvider } from "ethers";
import {
    EXPECTED_CHAIN_ID,
    EXPECTED_CHAIN_NAME,
} from "../Utils/contract-config";
import { upsertConnectedUser } from "../../services/userRegistryService";
import {
    loginWithCredentials,
    logoutCredentialSession,
    persistCredentialToken,
    readPersistedCredentialToken,
    registerWithCredentials,
    restoreCredentialSession,
} from "../../services/authService";
import { getReadOnlyProvider } from "../../services/readOnlyProvider";

const WALLET_SUPPRESSION_STORAGE_KEY = "shopcap.wallet.suppressed";

export const AuthContext = createContext(null);

export const useWeb3Auth = () => {
    const context = useContext(AuthContext);
    if (context === null || context === undefined) {
        throw new Error("useWeb3Auth must be used within an AuthProvider");
    }
    return context;
};

const READ_ONLY_NETWORK = {
    chainId: BigInt(EXPECTED_CHAIN_ID),
    name: EXPECTED_CHAIN_NAME,
};

function createWalletIdentity(account) {
    if (!account) {
        return null;
    }

    return {
        id: account.toLowerCase(),
        displayName: `${account.slice(0, 6)}...${account.slice(-4)}`,
        email: null,
        walletAddress: account,
        source: "wallet",
        createdAt: null,
        lastLoginAt: null,
    };
}

async function switchNetwork(chainId) {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Web3-кошелек недоступен в этом окружении.");
    }

    const hexChainId = `0x${parseInt(chainId, 10).toString(16)}`;

    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
        });
    } catch (error) {
        if (error.code === 4902) {
            throw new Error(
                `Сеть ${EXPECTED_CHAIN_NAME} не найдена в кошельке. Добавьте ее вручную и повторите попытку.`
            );
        }

        throw new Error(
            `Ошибка переключения сети: ${error.message || String(error)}`
        );
    }
}

async function connectWeb3Internal({
    requestAccess = false,
    allowSwitch = false,
} = {}) {
    if (typeof window === "undefined" || !window.ethereum) {
        if (requestAccess) {
            throw new Error(
                "MetaMask или другой Web3-кошелек не найден в браузере."
            );
        }

        return null;
    }

    const ethereumProvider = new BrowserProvider(window.ethereum);
    const method = requestAccess ? "eth_requestAccounts" : "eth_accounts";
    const accounts = await ethereumProvider.send(method, []);

    if (!accounts.length) {
        if (requestAccess) {
            throw new Error("В кошельке не выбран аккаунт.");
        }

        return null;
    }

    let currentNetwork = await ethereumProvider.getNetwork();

    if (currentNetwork.chainId.toString() !== EXPECTED_CHAIN_ID.toString()) {
        if (!allowSwitch) {
            throw new Error(
                `Для on-chain действий нужна сеть ${EXPECTED_CHAIN_NAME}. Сейчас выбрана сеть ${currentNetwork.name} (${currentNetwork.chainId}).`
            );
        }

        await switchNetwork(EXPECTED_CHAIN_ID);
        currentNetwork = await ethereumProvider.getNetwork();
    }

    const currentAccount = accounts[0];
    const ethSigner = await ethereumProvider.getSigner(currentAccount);

    return {
        provider: ethereumProvider,
        signer: ethSigner,
        account: currentAccount,
        network: currentNetwork,
    };
}

const subscribeToWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.on("accountsChanged", onAccountsChanged);
        window.ethereum.on("chainChanged", onChainChanged);
    }
};

const unsubscribeFromWeb3Events = (onAccountsChanged, onChainChanged) => {
    if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", onAccountsChanged);
        window.ethereum.removeListener("chainChanged", onChainChanged);
    }
};

const persistWalletUser = async ({ account, network }) => {
    try {
        await upsertConnectedUser({
            walletAddress: account,
            chainId: network?.chainId?.toString() || null,
            networkName: network?.name || "unknown",
            source: "metamask",
        });
    } catch (error) {
        console.warn("User registry save error:", error);
    }
};

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [walletProvider, setWalletProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [walletNetwork, setWalletNetwork] = useState(null);
    const [credentialUser, setCredentialUser] = useState(null);
    const [credentialToken, setCredentialToken] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [walletLoading, setWalletLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [walletError, setWalletError] = useState(null);
    const [authError, setAuthError] = useState(null);

    const readOnlyProvider = getReadOnlyProvider();
    const provider = walletProvider || readOnlyProvider;
    const network = walletNetwork || READ_ONLY_NETWORK;

    const clearWalletState = useCallback(() => {
        setAccount(null);
        setWalletProvider(null);
        setSigner(null);
        setWalletNetwork(null);
    }, []);

    const applyWalletState = useCallback((walletState) => {
        if (!walletState) {
            return;
        }

        setAccount(walletState.account);
        setWalletProvider(walletState.provider);
        setSigner(walletState.signer);
        setWalletNetwork(walletState.network);
    }, []);

    const restoreWalletSession = useCallback(async () => {
        const isSuppressed =
            localStorage.getItem(WALLET_SUPPRESSION_STORAGE_KEY) === "true";

        if (isSuppressed) {
            clearWalletState();
            return;
        }

        try {
            const walletState = await connectWeb3Internal({
                requestAccess: false,
                allowSwitch: false,
            });

            if (!walletState) {
                clearWalletState();
                return;
            }

            applyWalletState(walletState);
            setWalletError(null);
            void persistWalletUser(walletState);
        } catch (error) {
            clearWalletState();
            setWalletError(
                error.message ||
                    "Не удалось восстановить подключение к кошельку."
            );
        }
    }, [applyWalletState, clearWalletState]);

    const connectWallet = useCallback(async () => {
        setWalletLoading(true);
        setWalletError(null);
        localStorage.removeItem(WALLET_SUPPRESSION_STORAGE_KEY);

        try {
            const walletState = await connectWeb3Internal({
                requestAccess: true,
                allowSwitch: true,
            });

            applyWalletState(walletState);
            void persistWalletUser(walletState);
            return walletState;
        } catch (error) {
            clearWalletState();
            setWalletError(
                error.message || "Не удалось подключить Web3-кошелек."
            );
            throw error;
        } finally {
            setWalletLoading(false);
        }
    }, [applyWalletState, clearWalletState]);

    const disconnectWallet = useCallback(() => {
        localStorage.setItem(WALLET_SUPPRESSION_STORAGE_KEY, "true");
        clearWalletState();
        setWalletError(null);
    }, [clearWalletState]);

    const register = useCallback(async (credentials) => {
        setAuthLoading(true);
        setAuthError(null);

        try {
            const result = await registerWithCredentials(credentials);
            setCredentialUser(result.user);
            setCredentialToken(result.token);
            persistCredentialToken(result.token);
            return result.user;
        } catch (error) {
            setAuthError(
                error.message || "Не удалось зарегистрировать пользователя."
            );
            throw error;
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const login = useCallback(async (credentials) => {
        setAuthLoading(true);
        setAuthError(null);

        try {
            const result = await loginWithCredentials(credentials);
            setCredentialUser(result.user);
            setCredentialToken(result.token);
            persistCredentialToken(result.token);
            return result.user;
        } catch (error) {
            setAuthError(error.message || "Не удалось выполнить вход.");
            throw error;
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setAuthLoading(true);

        try {
            await logoutCredentialSession(credentialToken);
        } catch (error) {
            console.warn("Credential logout failed:", error);
        } finally {
            setCredentialUser(null);
            setCredentialToken(null);
            persistCredentialToken(null);
            disconnectWallet();
            setAuthError(null);
            setAuthLoading(false);
        }
    }, [credentialToken, disconnectWallet]);

    useEffect(() => {
        let isCancelled = false;

        const initAuth = async () => {
            setInitializing(true);

            const storedToken = readPersistedCredentialToken();

            if (storedToken) {
                try {
                    const session = await restoreCredentialSession(storedToken);
                    if (!isCancelled && session) {
                        setCredentialUser(session.user);
                        setCredentialToken(session.token);
                        persistCredentialToken(session.token);
                    }
                } catch (error) {
                    if (!isCancelled) {
                        setCredentialUser(null);
                        setCredentialToken(null);
                        persistCredentialToken(null);
                    }
                }
            }

            if (!isCancelled) {
                await restoreWalletSession();
            }

            if (!isCancelled) {
                setInitializing(false);
            }
        };

        initAuth();

        return () => {
            isCancelled = true;
        };
    }, [restoreWalletSession]);

    useEffect(() => {
        const handleAccountsChanged = (newAccounts) => {
            if (newAccounts.length > 0) {
                localStorage.removeItem(WALLET_SUPPRESSION_STORAGE_KEY);
                void restoreWalletSession();
                return;
            }

            disconnectWallet();
        };

        const handleChainChanged = () => {
            void restoreWalletSession();
        };

        subscribeToWeb3Events(handleAccountsChanged, handleChainChanged);

        return () => {
            unsubscribeFromWeb3Events(
                handleAccountsChanged,
                handleChainChanged
            );
        };
    }, [disconnectWallet, restoreWalletSession]);

    const walletIdentity = createWalletIdentity(account);
    const currentUser = credentialUser
        ? {
              ...credentialUser,
              walletAddress: account || null,
          }
        : walletIdentity;
    const isWalletConnected = Boolean(account && signer);
    const isAuthenticated = Boolean(credentialUser || isWalletConnected);
    const authType = credentialUser
        ? isWalletConnected
            ? "hybrid"
            : "credentials"
        : isWalletConnected
          ? "wallet"
          : "guest";
    const userKey = account ? account.toLowerCase() : credentialUser?.id || null;

    const contextValue = {
        account,
        provider,
        signer,
        network,
        loading: initializing || walletLoading,
        initializing,
        walletLoading,
        authLoading,
        error: authError || walletError,
        walletError,
        authError,
        connectWallet,
        disconnectWallet,
        login,
        register,
        logout,
        credentialUser,
        credentialToken,
        currentUser,
        userKey,
        authType,
        isAuthenticated,
        isWalletConnected,
        hasWalletInstalled:
            typeof window !== "undefined" && Boolean(window.ethereum),
        canUseBlockchain: Boolean(signer),
        isReadOnlyMode: Boolean(!signer),
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
