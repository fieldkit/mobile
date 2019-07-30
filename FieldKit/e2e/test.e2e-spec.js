"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
            const authenticatedMessage = yield driver.findElementByText('authenticated', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield authenticatedMessage.isDisplayed());
        });
    });
    it("should go to stations view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const viewStationsButton = yield driver.findElementByText('View Stations', nativescript_dev_appium_1.SearchOptions.exact);
            viewStationsButton.click();
            const stationsHeading = yield driver.findElementByText('FieldKit Stations', nativescript_dev_appium_1.SearchOptions.exact);
            chai_1.assert.isTrue(yield stationsHeading.isDisplayed());
        });
    });
    // Note: from this point on, there must be at least one station connected
    it("should go to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const allFields = yield driver.driver.waitForElementsByClassName(driver.locators.getElementByName("label"), 10000);
            // The first label is the page heading, so click the second label
            yield allFields[1].click();
            const batteryLevel = yield driver.findElementByText('Battery', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield batteryLevel.isDisplayed());
        });
    });
    it("should go to module view and find a chart", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const moduleLink = yield driver.findElementByAccessibilityId('moduleLink0');
            yield moduleLink.click();
            const chart = yield driver.findElementByAccessibilityId('graphedSensorChart0');
            chai_1.assert.isTrue(yield chart.isDisplayed());
        });
    });
    it("should go back to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const backButton = yield driver.findElementByAccessibilityId('backButton');
            yield backButton.click();
            const batteryLevel = yield driver.findElementByText('Battery', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield batteryLevel.isDisplayed());
        });
    });
    // Note: this requires a station has a status of "Ready to deploy"
    it("should go to first step of deployment wizard", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const deployButton = yield driver.findElementByAccessibilityId('deployButton');
            yield deployButton.click();
            const map = yield driver.findElementByAccessibilityId('currentLocationMap');
            chai_1.assert.isTrue(yield map.isDisplayed());
        });
    });
    it("should go to second step of deployment wizard", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const nextButton = yield driver.findElementByAccessibilityId('nextButton');
            yield nextButton.click();
            const addAudio = yield driver.findElementByAccessibilityId('addAudioNote');
            chai_1.assert.isTrue(yield addAudio.isDisplayed());
        });
    });
    // it("should take a picture")
});
