"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nativescript_dev_appium_1 = require("nativescript-dev-appium");
const chai_1 = require("chai");
const secrets_1 = require("../app/secrets");
const addContext = require('mochawesome/addContext');
describe("FieldKit Navigation", () => {
    let driver;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            nativescript_dev_appium_1.nsCapabilities.testReporter.context = this;
            driver = yield nativescript_dev_appium_1.createDriver();
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield driver.quit();
            console.log("Quit driver!");
        });
    });
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentTest.state === "failed") {
                yield driver.logTestArtifacts(this.currentTest.title);
            }
        });
    });
    it("should log in", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const passwordInput = yield driver.findElementByAccessibilityId('loginPasswordInput');
            yield passwordInput.type(secrets_1.PASSWORD);
            const emailInput = yield driver.findElementByAccessibilityId('loginEmailInput');
            yield emailInput.type(secrets_1.USERNAME);
            yield driver.driver.hideDeviceKeyboard("Done");
            const logInButton = yield driver.findElementByText('Log In', nativescript_dev_appium_1.SearchOptions.exact);
            yield logInButton.click();
            yield driver.wait(5000);
            const stationsHeading = yield driver.findElementByText('FieldKit Stations', nativescript_dev_appium_1.SearchOptions.exact);
            chai_1.assert.isTrue(yield stationsHeading.isDisplayed());
        });
    });
    // Note: from this point on, there must be at least one undeployed station connected
    it("should go to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const allFields = yield driver.driver.waitForElementsByClassName(driver.locators.getElementByName("label"), 10000);
            // The first label is the page heading, and the second is 'Looking for stations' (even hidden) so click the third label
            yield allFields[2].click();
            yield driver.wait(5000);
            const memoryLabel = yield driver.findElementByText('Memory', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield memoryLabel.isDisplayed());
        });
    });
    it("should go to data sync view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSyncLink = yield driver.findElementByAccessibilityId('linkToDataSync');
            yield dataSyncLink.click();
            yield driver.wait(2000);
            const layout = yield driver.findElementByAccessibilityId('dataSyncLayout');
            chai_1.assert.isTrue(yield layout.isDisplayed());
        });
    });
    it("should go back to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const backButton = yield driver.findElementByAccessibilityId('linkToStations');
            yield backButton.click();
            yield driver.wait(5000);
            const allFields = yield driver.driver.waitForElementsByClassName(driver.locators.getElementByName("label"), 10000);
            // The first label is the page heading, and the second is 'Looking for stations' (even hidden) so click the third label
            yield allFields[2].click();
            yield driver.wait(5000);
            const memoryLabel = yield driver.findElementByText('Memory', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield memoryLabel.isDisplayed());
        });
    });
    it("should go to first step of deployment", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const deployButton = yield driver.findElementByAccessibilityId('deployButton');
            yield deployButton.click();
            if (driver.isAndroid) {
                yield driver.wait(5000);
                const allow = yield driver.findElementByText("ALLOW", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
            }
            else {
                yield driver.wait(10000);
                const allow = yield driver.findElementByAccessibilityId('Allow');
                yield allow.click();
            }
            const map = yield driver.findElementByAccessibilityId('currentLocationMap');
            chai_1.assert.isTrue(yield map.isDisplayed());
        });
    });
    it("should go to second step of deployment", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const nextButton = yield driver.findElementByAccessibilityId('nextButton');
            yield nextButton.click();
            const layout = yield driver.findElementByAccessibilityId('deployNotesLayout');
            chai_1.assert.isTrue(yield layout.isDisplayed());
        });
    });
    it("should add an audio note", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const addNote = yield driver.findElementByAccessibilityId('noteField0');
            yield driver.wait(5000);
            const addAudio = yield driver.findElementByAccessibilityId('addAudioNote');
            yield addAudio.click();
            const startButton = yield driver.findElementByAccessibilityId("startRecording");
            yield startButton.click();
            yield driver.wait(2000);
            if (driver.isAndroid) {
                const allow = yield driver.findElementByText("ALLOW", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
            }
            else {
                const allow = yield driver.findElementByText("OK", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
            }
            yield driver.wait(2000);
            const stopButton = yield driver.findElementByAccessibilityId("stopRecording");
            yield stopButton.click();
            const savedAudio = yield driver.findElementByAccessibilityId('audioRecording0');
            chai_1.assert.isTrue(yield savedAudio.isDisplayed());
        });
    });
    it("should add a picture", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const addPhoto = yield driver.findElementByAccessibilityId('addPhoto');
            yield addPhoto.click();
            if (driver.isAndroid) {
                const takePictureButton = yield driver.findElementByText("Take picture");
                yield takePictureButton.click();
                // await driver.wait(1000);
                // let allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
                // await allow.click();
                // allow = await driver.findElementByText("ALLOW", SearchOptions.exact);
                // await allow.click();
                // const shutter = await driver.findElementByAccessibilityId("Shutter");
                // await shutter.click();
                // const acceptBtn = await driver.findElementByAccessibilityId("Done");
                // await acceptBtn.click();
                yield driver.wait(1000);
                let allow = yield driver.findElementByText("ALLOW", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
                allow = yield driver.findElementByText("ALLOW", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
                // const deny = await driver.findElementByText("Deny", SearchOptions.contains);
                // await deny.click();
                // let nextBtnLocationTag = await driver.findElementByText("NEXT", SearchOptions.exact);
                // await nextBtnLocationTag.click();
                let shutter = yield driver.findElementByAccessibilityId("Shutter"); // Take a picture
                yield shutter.click();
                // workaround for issue in android initial camera app open
                yield driver.navBack();
                yield takePictureButton.click();
                yield shutter.click();
                let acceptBtn = yield driver.findElementByAccessibilityId("Done"); // Accept it
                yield acceptBtn.click();
            }
            else {
                const selectFromGallery = yield driver.findElementByText("Select from gallery");
                yield selectFromGallery.click();
                const ok = yield driver.findElementByAccessibilityId("OK");
                yield ok.click();
                const cameraRoll = yield driver.findElementByAccessibilityId("Camera Roll");
                yield cameraRoll.click();
                yield driver.wait(2000);
                yield driver.clickPoint(50, 200); // Select image
            }
            yield driver.wait(10000);
            const savedPhoto = yield driver.findElementByAccessibilityId('deployPhoto0');
            chai_1.assert.isTrue(yield savedPhoto.isDisplayed());
        });
    });
});
