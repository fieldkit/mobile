import { AppiumDriver, createDriver, SearchOptions, nsCapabilities } from "nativescript-dev-appium";
import { assert, expect } from "chai";
import { USERNAME, PASSWORD } from "../app/secrets";
const addContext = require('mochawesome/addContext');

// Note: These tests require at least one undeployed station to be connected

// Note: Install Appium and have it running, iOS test won't run without it
// http://appium.io/downloads.html

// Note: Appium installs the built version of the app so first run:
// tns build android --bundle
// tns build ios --bundle

// To run tests (add targets in appium.capabilities.json):
// npm run e2e -- --runType libbey_androidPhone
// npm run e2e -- --runType sim.iPhone6

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
        const emailInput = await driver.findElementByAccessibilityId('loginEmailInput');
        await emailInput.type(USERNAME);
        const passwordInput = await driver.findElementByAccessibilityId('loginPasswordInput');
        await passwordInput.type(PASSWORD);
        await driver.driver.hideDeviceKeyboard("Done");
        const logInButton = await driver.findElementByText('Log In', SearchOptions.exact);
        await logInButton.click();
        await driver.wait(5000);
        const stationsHeading = await driver.findElementByText('FieldKit Stations', SearchOptions.exact);
        assert.isTrue(await stationsHeading.isDisplayed());
    });

    it("should go to station detail view", async function() {
        const stationLink = await driver.findElementByAccessibilityId('linkToStation0');
        await stationLink.click();
        await driver.wait(5000);
        const memoryLabel = await driver.findElementByText('Memory', SearchOptions.contains);
        assert.isTrue(await memoryLabel.isDisplayed());
    });

    it("should go to data sync view", async function() {
        const dataSyncLink = await driver.findElementByAccessibilityId('linkToDataSync');
        await dataSyncLink.click();
        await driver.wait(2000);
        const layout = await driver.findElementByAccessibilityId('dataSyncLayout');
        assert.isTrue(await layout.isDisplayed());
    });

    it("should go back to station detail view", async function() {
        const backButton = await driver.findElementByAccessibilityId('linkToStations');
        await backButton.click();
        await driver.wait(5000);
        const stationLink = await driver.findElementByAccessibilityId('linkToStation0');
        await stationLink.click();
        await driver.wait(5000);
        const memoryLabel = await driver.findElementByText('Memory', SearchOptions.contains);
        assert.isTrue(await memoryLabel.isDisplayed());
    });

    it("should go to first step of deployment", async function() {
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

    it("should go to second step of deployment", async function() {
        const nextButton = await driver.findElementByAccessibilityId('nextButton');
        await nextButton.click();
        const layout = await driver.findElementByAccessibilityId('deployNotesLayout');
        assert.isTrue(await layout.isDisplayed());
    });

    it("should add an audio note", async function() {
        const addNote = await driver.findElementByAccessibilityId('noteField0');
        await addNote.click();
        await driver.wait(5000);
        const addAudio = await driver.findElementByAccessibilityId('addAudioNote');
        await addAudio.click();
        const startButton = await driver.findElementByAccessibilityId("startRecording");
        await startButton.click();

        if(driver.isAndroid) {
            const allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
            await allow.click();
        } else {
            const allow = await driver.findElementByText("OK", SearchOptions.exact);
            await allow.click();
        }
        await driver.wait(2000);
        const stopButton = await driver.findElementByAccessibilityId("stopRecording");
        await stopButton.click();
        const savedAudio = await driver.findElementByAccessibilityId('audioRecording0');
        assert.isTrue(await savedAudio.isDisplayed());
    });

});