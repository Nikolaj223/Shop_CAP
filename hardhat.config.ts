// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // Включает ряд плагинов, включая ethers
import * as dotenv from "dotenv"; // Импортируем dotenv
import "@nomicfoundation/hardhat-verify"; // Для верификации контрактов на Etherscan

// Загружаем переменные окружения из .env файла
dotenv.config();

const config: HardhatUserConfig = {
    // Сеть по умолчанию для выполнения команд Hardhat
    defaultNetwork: "hardhat",
    // Конфигурация различных сетей
    networks: {
        // Локальная сеть Hardhat для разработки и тестирования
        hardhat: {
            accounts: {
                count: 20, // Количество тестовых аккаунтов, доступных в локальной сети
            },
        },
        // Конфигурация для тестовой сети Sepolia
        sepolia: {
            // URL RPC-узла Sepolia (например, Infura или Alchemy)
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`,
            // Приватный ключ аккаунта, используемого для развертывания в Sepolia
            // Приватный ключ должен быть в .env файле как SEPOLIA_TESTNET_PRIVATE_KEY
            // Если ключ не установлен, используется пустой массив, чтобы избежать ошибок.
            accounts: process.env.SEPOLIA_TESTNET_PRIVATE_KEY
                ? [process.env.SEPOLIA_TESTNET_PRIVATE_KEY]
                : [],
            chainId: 11155111, // Явно указываем Chain ID для Sepolia (хорошая практика)
        },
        // Можно добавить и другие сети, например, localhost для подключения к локальному Hardhat ноду
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337, // Стандартный Chain ID для Hardhat Network
        },
    },
    // Конфигурация компилятора Solidity
    solidity: {
        version: "0.8.28", // Версия Solidity, используемая для компиляции контрактов
        settings: {
            optimizer: {
                enabled: true, // Включаем оптимизатор кода
                runs: 200, // Количество прогонов оптимизатора (больше прогонов = меньше газа, дольше компиляция)
            },
        },
    },
    // Конфигурация для верификации контрактов на Etherscan
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY, // API ключ Etherscan из .env файла
    },
    // Конфигурация для Hardhat Gas Reporter (отображает потребление газа)
    // gasReporter: {
    //     enabled: process.env.REPORT_GAS === "true" ? true : false, // Включается, если REPORT_GAS=true в .env
    //     currency: "USD", // Валюта для отчетов по газу
    //     coinmarketcap: process.env.COINMARKETCAP_API_KEY, // API ключ CoinMarketCap для получения цен
    //     token: "ETH", // Токен, для которого рассчитываются цены газа
    // },
};

export default config;
