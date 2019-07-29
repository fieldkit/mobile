import { AppiumDriver, createDriver, SearchOptions, nsCapabilities } from "nativescript-dev-appium";
import { assert } from "chai";
import { USERNAME, PASSWORD } from "../app/secrets";
const addContext = require('mochawesome/addContext');

describe("LoginView", () => {
    let driver: AppiumDriver;

    before(async function(){
        nsCapabilities.testReporter.context = this;
        driver = await createDriver();
    });

    after(async function () {
        await driver.quit();
        console.log("Quit driver!");
    });

    afterEach(async function () {
        if (this.currentTest.state === "failed") {
            await driver.logTestArtifacts(this.currentTest.title);
        }
    });

    it("should find password element by accessibility id", async function () {
        const input = await driver.findElementByAccessibilityId('loginPasswordInput');
        assert.isTrue(await input.isDisplayed());
    });

    it("should log in", async function() {
        if (driver.isAndroid) {
            const allFields = await driver.driver.waitForElementsByClassName(driver.locators.getElementByName("textfield"), 10000);
            await allFields[1].click().sendKeys(PASSWORD);
            await allFields[0].click().sendKeys(USERNAME);
        } else {
            // const passField = await driver.driver.waitForElementByClassName(driver.locators.getElementByName("securetextfield"), 10000);
            // await passField.click().sendKeys(PASSWORD);
            // const usernameField = await driver.driver.waitForElementByClassName(driver.locators.getElementByName("textfield"), 10000);
            // await usernameField.click().sendKeys(USERNAME);
        }
        await driver.driver.hideDeviceKeyboard("Done");
        if (driver.isAndroid) {
            const logInButton = await driver.findElementByText('Log In', SearchOptions.exact);
            await logInButton.click();
        } else {
            // const logInButton = await driver.findElementByXPath("//" + driver.locators.button + loginButtonElement);
            // await logInButton.click();
            // const continueButton = await driver.findElementByXPath("//" + driver.locators.button + continueButtonAttribute);
            // await continueButton.click();
        }
        const authenticatedMessage = await driver.findElementByText('authenticated', SearchOptions.contains);
        assert.isTrue(await authenticatedMessage.isDisplayed());
    })

});