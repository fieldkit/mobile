import { AppiumDriver, createDriver, SearchOptions, nsCapabilities } from "nativescript-dev-appium";
import { assert } from "chai";
import { USERNAME, PASSWORD } from "../app/secrets";
const addContext = require('mochawesome/addContext');

describe("FieldKit Navigation", () => {
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

    it("should log in", async function() {
        const passwordInput = await driver.findElementByAccessibilityId('loginPasswordInput');
        await passwordInput.type(PASSWORD);
        const emailInput = await driver.findElementByAccessibilityId('loginEmailInput');
        await emailInput.type(USERNAME);
        await driver.driver.hideDeviceKeyboard("Done");
        const logInButton = await driver.findElementByText('Log In', SearchOptions.exact);
        await logInButton.click();
        const authenticatedMessage = await driver.findElementByText('authenticated', SearchOptions.contains);
        assert.isTrue(await authenticatedMessage.isDisplayed());
    });

    it("should go to stations view", async function() {
        const viewStationsButton = await driver.findElementByText('View Stations', SearchOptions.exact);
        viewStationsButton.click();
        const stationsHeading = await driver.findElementByText('FieldKit Stations', SearchOptions.exact);
        assert.isTrue(await stationsHeading.isDisplayed());
    });

    // Note: from this point on, there must be at least one station connected
    it("should go to station detail view", async function() {
        const allFields = await driver.driver.waitForElementsByClassName(driver.locators.getElementByName("label"), 10000);
        // The first label is the page heading, so click the second label
        await allFields[1].click()
        const batteryLevel = await driver.findElementByText('Battery', SearchOptions.contains);
        assert.isTrue(await batteryLevel.isDisplayed());
    });

    it("should go to module view and find a chart", async function() {
        const moduleLink = await driver.findElementByAccessibilityId('moduleLink0');
        await moduleLink.click();
        const chart = await driver.findElementByAccessibilityId('graphedSensorChart0');
        assert.isTrue(await chart.isDisplayed());
    });

    it("should go back to station detail view", async function() {
        const backButton = await driver.findElementByAccessibilityId('backButton');
        await backButton.click();
        const batteryLevel = await driver.findElementByText('Battery', SearchOptions.contains);
        assert.isTrue(await batteryLevel.isDisplayed());
    });

    // Note: this requires a station has a status of "Ready to deploy"
    it("should go to first step of deployment wizard", async function() {
        const deployButton = await driver.findElementByAccessibilityId('deployButton');
        await deployButton.click();
        const map = await driver.findElementByAccessibilityId('currentLocationMap');
        assert.isTrue(await map.isDisplayed());
    });

    it("should go to second step of deployment wizard", async function() {
        const nextButton = await driver.findElementByAccessibilityId('nextButton');
        await nextButton.click();
        const addAudio = await driver.findElementByAccessibilityId('addAudioNote');
        assert.isTrue(await addAudio.isDisplayed());
    });

    // it("should take a picture")

});