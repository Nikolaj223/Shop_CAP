// scripts/deploy.ts
import { ethers } from "hardhat";
import { Signer } from "ethers"; // Явно импортируем тип Signer

async function main() {
    // Получаем аккаунт, который будет выполнять развертывание.
    // Это будет наш 'deployer'.
    const [deployer]: Signer[] = await ethers.getSigners();
    console.log(
        "Развертывание контрактов с аккаунта:",
        await deployer.getAddress()
    );

    // --- 1. Развертывание ShopCAPToken ---
    // Конструктор ShopCAPToken ожидает 0 или 1 аргумент.
    // Если ваш контракт ShopCAPToken.sol имеет пустой конструктор (как часто бывает для ERC20,
    // где имя, символ и десятичные знаки задаются в базовом ERC20), то deploy() вызывается без аргументов.
    console.log("Развертывание ShopCAPToken...");
    const ShopCAPTokenFactory = await ethers.getContractFactory("ShopCAPToken");
    const shopCAPToken = await ShopCAPTokenFactory.deploy(); // Deploy без аргументов
    await shopCAPToken.waitForDeployment();
    const deployedShopCAPTokenAddress = await shopCAPToken.getAddress();
    console.log(
        `ShopCAPToken развернут по адресу: ${deployedShopCAPTokenAddress}`
    );

    // --- 2. Развертывание PartnerRegistry ---
    // Конструктор PartnerRegistry, вероятно, не принимает аргументов.
    console.log("Развертывание PartnerRegistry...");
    const PartnerRegistryFactory = await ethers.getContractFactory(
        "PartnerRegistry"
    );
    const partnerRegistry = await PartnerRegistryFactory.deploy();
    await partnerRegistry.waitForDeployment();
    const deployedPartnerRegistryAddress = await partnerRegistry.getAddress();
    console.log(
        `PartnerRegistry развернут по адресу: ${deployedPartnerRegistryAddress}`
    );

    // --- 3. Развертывание CashbackManager ---
    // Конструктор CashbackManager ожидает 3 аргумента:
    // _shopCapTokenAddress, _partnerRegistryAddress, _initialReserveWallet.
    // В качестве _initialReserveWallet используем адрес деплоера.
    console.log("Развертывание CashbackManager...");
    const CashbackManagerFactory = await ethers.getContractFactory(
        "CashbackManager"
    );
    const cashbackManager = await CashbackManagerFactory.deploy(
        deployedShopCAPTokenAddress, // _shopCapTokenAddress
        deployedPartnerRegistryAddress, // _partnerRegistryAddress
        await deployer.getAddress() // _initialReserveWallet (используем адрес деплоера)
    );
    await cashbackManager.waitForDeployment();
    const deployedCashbackManagerAddress = await cashbackManager.getAddress();
    console.log(
        `CashbackManager развернут по адресу: ${deployedCashbackManagerAddress}`
    );

    // --- 4. Развертывание ShopCAPPlatform ---
    // Конструктор ShopCAPPlatform ожидает 2 аргумента:
    // _partnerRegistryAddress, _cashbackManagerAddress.
    console.log("Развертывание ShopCAPPlatform...");
    const ShopCAPPlatformFactory = await ethers.getContractFactory(
        "ShopCAPPlatform"
    );
    const shopCAPPlatform = await ShopCAPPlatformFactory.deploy(
        deployedPartnerRegistryAddress, // _partnerRegistryAddress
        deployedCashbackManagerAddress // _cashbackManagerAddress
    );
    await shopCAPPlatform.waitForDeployment();
    const deployedShopCAPPlatformAddress = await shopCAPPlatform.getAddress();
    console.log(
        `ShopCAPPlatform развернут по адресу: ${deployedShopCAPPlatformAddress}`
    );

    // --- Вывод команд для верификации ---
    console.log("\n---------- КОМАНДЫ ДЛЯ ВЕРИФИКАЦИИ ----------");
    console.log(
        "ЗАПИШИТЕ ИХ! Эти команды понадобятся для верификации на Sepolia Etherscan."
    );
    console.log("----- Запустите их по очереди после развертывания -----");

    console.log(`\n// Верификация ShopCAPToken`);
    // Аргументы для верификации должны точно соответствовать аргументам конструктора.
    // Если ShopCAPToken без аргументов, то и здесь без них.
    console.log(
        `npx hardhat verify --network sepolia ${deployedShopCAPTokenAddress}`
    );

    console.log(`\n// Верификация PartnerRegistry`);
    console.log(
        `npx hardhat verify --network sepolia ${deployedPartnerRegistryAddress}`
    );

    console.log(`\n// Верификация CashbackManager`);
    // Аргументы для верификации CashbackManager:
    // _shopCapTokenAddress, _partnerRegistryAddress, _initialReserveWallet
    console.log(
        `npx hardhat verify --network sepolia ${deployedCashbackManagerAddress} ${deployedShopCAPTokenAddress} ${deployedPartnerRegistryAddress} ${await deployer.getAddress()}`
    );

    console.log(`\n// Верификация ShopCAPPlatform`);
    // Аргументы для верификации ShopCAPPlatform:
    // _partnerRegistryAddress, _cashbackManagerAddress
    console.log(
        `npx hardhat verify --network sepolia ${deployedShopCAPPlatformAddress} ${deployedPartnerRegistryAddress} ${deployedCashbackManagerAddress}`
    );
    console.log("-------------------------------------------\n");
}

// Стандартная обработка ошибок для скриптов Hardhat
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
