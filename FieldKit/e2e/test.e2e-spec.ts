import { AppiumDriver, createDriver, SearchOptions, nsCapabilities } from "nativescript-dev-appium";
import { assert, expect } from "chai";
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
        await driver.wait(5000);
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

    it("should go to first step of deployment wizard", async function() {
        const deployButton = await driver.findElementByAccessibilityId('deployButton');
        await deployButton.click();
        if(driver.isAndroid) {
            await driver.wait(5000);
            const allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
        } else {
            await driver.wait(10000);
            const allow = await driver.findElementByAccessibilityId('Allow');
            await allow.click();
        }
        const map = await driver.findElementByAccessibilityId('currentLocationMap');
        assert.isTrue(await map.isDisplayed());
    });

    it("should go to second step of deployment wizard", async function() {
        const nextButton = await driver.findElementByAccessibilityId('nextButton');
        await nextButton.click();
        const addAudio = await driver.findElementByAccessibilityId('addAudioNote');
        assert.isTrue(await addAudio.isDisplayed());
    });

    it("should add a picture", async function() {
        const addPhoto = await driver.findElementByAccessibilityId('addPhoto');
        await addPhoto.click();

        if (driver.isAndroid) {
            const takePictureButton = await driver.findElementByText("Take picture");
            await takePictureButton.click();
            await driver.wait(1000);
            let allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
            allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
            const shutter = await driver.findElementByAccessibilityId("Shutter");
            await shutter.click();
            const acceptBtn = await driver.findElementByAccessibilityId("Done");
            await acceptBtn.click();
        } else {
            const selectFromGallery = await driver.findElementByText("Select from gallery");
            await selectFromGallery.click();
            const ok = await driver.findElementByAccessibilityId("OK");
            await ok.click();
            const cameraRoll = await driver.findElementByAccessibilityId("Camera Roll");
            await cameraRoll.click();
            await driver.wait(2000);
            await driver.clickPoint(50, 200); // Select image
        }
        const savedPhoto = await driver.findElementByAccessibilityId('deploymentPhoto');
        assert.isTrue(await savedPhoto.isDisplayed());
    });

    it("should add an audio note", async function() {
        const addAudio = await driver.findElementByAccessibilityId('addAudioNote');
        await addAudio.click();
        const startButton = await driver.findElementByText("Start recording");
        await startButton.click();
        await driver.wait(2000);

        if(driver.isAndroid) {
            const allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
        } else {
            const allow = await driver.findElementByText("OK", SearchOptions.exact);
            await allow.click();
        }
        await driver.wait(2000);
        const stopButton = await driver.findElementByText("Stop recording");
        await stopButton.click();
        const savedAudio = await driver.findElementByAccessibilityId('audioRecording0');
        assert.isTrue(await savedAudio.isDisplayed());
    });

});