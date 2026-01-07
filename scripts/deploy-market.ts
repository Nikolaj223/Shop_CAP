import { ethers, run } from "hardhat";
import { Signer } from "ethers";
import * as fs from "fs";
import * as path from "path";

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_NAME = "Sepolia";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const [deployer]: Signer[] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("=== Начало деплоя обновленной платформы ===");
    console.log("Используемый аккаунт:", deployerAddress);

    const ShopCAPTokenFactory = await ethers.getContractFactory("ShopCAPToken");
    const shopCAPToken = await ShopCAPTokenFactory.deploy();
    await shopCAPToken.waitForDeployment();
    const tokenAddr = await shopCAPToken.getAddress();
    console.log(`ShopCAPToken развернут: ${tokenAddr}`);

    const PartnerRegistryFactory = await ethers.getContractFactory(
        "PartnerRegistry"
    );
    const partnerRegistry = await PartnerRegistryFactory.deploy();
    await partnerRegistry.waitForDeployment();
    const registryAddr = await partnerRegistry.getAddress();
    console.log(`PartnerRegistry развернут: ${registryAddr}`);

    const CashbackManagerFactory = await ethers.getContractFactory(
        "CashbackManager"
    );
    const cashbackManager = await CashbackManagerFactory.deploy(
        tokenAddr,
        registryAddr,
        deployerAddress
    );
    await cashbackManager.waitForDeployment();
    const managerAddr = await cashbackManager.getAddress();
    console.log(`CashbackManager развернут: ${managerAddr}`);

    const ShopCAPPlatformFactory = await ethers.getContractFactory(
        "ShopCAPPlatform"
    );
    const shopCAPPlatform = await ShopCAPPlatformFactory.deploy(
        registryAddr,
        managerAddr,
        tokenAddr
    );
    await shopCAPPlatform.waitForDeployment();
    const platformAddr = await shopCAPPlatform.getAddress();
    console.log(`ShopCAPPlatform развернута: ${platformAddr}`);

    console.log(
        "\nПропуск передачи прав (не требуется для текущей версии MVP)..."
    );

    console.log("\nПодготовка к верификации (ожидание 30 секунд)...");
    await sleep(30000);

    const verifyContract = async (address: string, args: any[]) => {
        try {
            await run("verify:verify", {
                address: address,
                constructorArguments: args,
            });
            console.log(`Контракт ${address} успешно подтвержден!`);
        } catch (error: any) {
            if (error.message.toLowerCase().includes("already verified")) {
                console.log(`Контракт ${address} уже был верифицирован.`);
            } else {
                console.error(
                    `Ошибка при верификации ${address}:`,
                    error.message
                );
            }
        }
    };

    console.log("Запуск верификации...");
    await verifyContract(tokenAddr, []);
    await verifyContract(registryAddr, []);
    await verifyContract(managerAddr, [
        tokenAddr,
        registryAddr,
        deployerAddress,
    ]);
    await verifyContract(platformAddr, [registryAddr, managerAddr, tokenAddr]);

    updateFrontendConfig(tokenAddr, registryAddr, managerAddr, platformAddr);
}

function updateFrontendConfig(
    token: string,
    registry: string,
    manager: string,
    platform: string
) {
    const frontendUtilsDir = path.join(__dirname, "../frontend/src/utils");
    if (!fs.existsSync(frontendUtilsDir)) {
        fs.mkdirSync(frontendUtilsDir, { recursive: true });
    }

    const configContent = `
export const contractAddresses = {
    ${SEPOLIA_CHAIN_ID}: {
        shopCAPToken: "${token}",
        partnerRegistry: "${registry}",
        cashbackManager: "${manager}",
        shopCAPPlatform: "${platform}",
    },
};
export const EXPECTED_CHAIN_ID = "${SEPOLIA_CHAIN_ID}";
export const EXPECTED_CHAIN_NAME = "${SEPOLIA_CHAIN_NAME}";
`;
    fs.writeFileSync(
        path.join(frontendUtilsDir, "contract-config.js"),
        configContent
    );
    console.log("\nКонфигурация фронтенда обновлена.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
