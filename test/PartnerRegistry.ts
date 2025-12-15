// test/PartnerRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { PartnerRegistry } from "../typechain-types/contracts/PartnerRegistry";
import { PartnerRegistry__factory } from "../typechain-types/factories/contracts/PartnerRegistry__factory";

describe("PartnerRegistry", function () {
    let partnerRegistry: PartnerRegistry;
    let owner: any;
    let addr1: any;
    let addr2: any;
    let nonOwner: any;

    // Данные для создания партнера
    const partnerName = "Test Partner";
    const partnerDescription = "A partner for testing purposes";
    const referralLink = "https://testpartner.com/ref";

    beforeEach(async function () {
        [owner, addr1, addr2, nonOwner] = await ethers.getSigners();
        const PartnerRegistryFactory = (await ethers.getContractFactory(
            "PartnerRegistry",
            owner
        )) as PartnerRegistry__factory;

        partnerRegistry =
            (await PartnerRegistryFactory.deploy()) as PartnerRegistry;
        await partnerRegistry.waitForDeployment();
    });

    // Проверка установки владельца
    it("Should set the right owner upon deployment", async function () {
        expect(await partnerRegistry.owner()).to.equal(owner.address);
    });

    // Добавление нового партнера
    it("Should allow owner to add a new partner", async function () {
        await expect(
            partnerRegistry
                .connect(owner)
                .addPartner(
                    partnerName,
                    partnerDescription,
                    referralLink,
                    addr1.address
                )
        )
            .to.emit(partnerRegistry, "PartnerAdded")
            .withArgs(1, partnerName, addr1.address); // Ожидаем ID 1, т.к. это первый добавленный партнер

        // Проверяем детали добавленного партнера
        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true;
        expect(name).to.equal(partnerName);
        expect(description).to.equal(partnerDescription);
        expect(link).to.equal(referralLink);
        expect(wallet).to.equal(addr1.address);
    });

    // Обновление информации о партнере
    it("Should allow owner to update a partner's information", async function () {
        // Сначала добавляем партнера
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        const updatedName = "Updated Partner Name";
        const updatedDescription = "New description";
        const updatedReferralLink = "https://newlink.com";
        const newPartnerWallet = addr2.address; // Новый кошелек партнера

        await expect(
            partnerRegistry
                .connect(owner)
                .updatePartner(
                    1,
                    updatedName,
                    updatedDescription,
                    updatedReferralLink,
                    newPartnerWallet
                )
        )
            .to.emit(partnerRegistry, "PartnerUpdated")
            .withArgs(1, updatedName, newPartnerWallet);

        // Проверяем обновленные детали
        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true; // Статус активности не меняется при обновлении
        expect(name).to.equal(updatedName);
        expect(description).to.equal(updatedDescription);
        expect(link).to.equal(updatedReferralLink);
        expect(wallet).to.equal(newPartnerWallet);
    });

    //Нельзя обновить партнера с недействительным ID
    it("Should revert if updating non-existent partner ID", async function () {
        await expect(
            partnerRegistry
                .connect(owner)
                .updatePartner(
                    999,
                    partnerName,
                    partnerDescription,
                    referralLink,
                    addr1.address
                )
        ).to.be.revertedWith("Invalid partner ID");
    });

    //Нельзя изменить статус партнера с недействительным ID
    it("Should revert if toggling status for non-existent partner ID", async function () {
        await expect(
            partnerRegistry.connect(owner).togglePartnerStatus(999, false)
        ).to.be.revertedWith("Invalid partner ID");
    });

    // Получение деталей партнера
    it("Should return correct partner details for a valid ID", async function () {
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        const [isActive, name, description, link, wallet] =
            await partnerRegistry.getPartnerDetails(1);
        expect(isActive).to.be.true;
        expect(name).to.equal(partnerName);
        expect(description).to.equal(partnerDescription);
        expect(link).to.equal(referralLink);
        expect(wallet).to.equal(addr1.address);
    });

    // Нельзя получить детали для недействительного ID
    it("Should revert if getting details for non-existent partner ID", async function () {
        await expect(partnerRegistry.getPartnerDetails(999)).to.be.revertedWith(
            "Invalid partner ID"
        );
    });

    // Получение кошелька партнера
    it("Should return correct partner wallet for a valid ID", async function () {
        await partnerRegistry
            .connect(owner)
            .addPartner(
                partnerName,
                partnerDescription,
                referralLink,
                addr1.address
            );

        expect(await partnerRegistry.getPartnerWallet(1)).to.equal(
            addr1.address
        );
    });

    // Нельзя получить кошелек для недействительного ID
    it("Should revert if getting wallet for non-existent partner ID", async function () {
        await expect(partnerRegistry.getPartnerWallet(999)).to.be.revertedWith(
            "Invalid partner ID"
        );
    });
});
