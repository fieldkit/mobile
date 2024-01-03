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
    let driver;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (nativescript_dev_appium_1.nsCapabilities && nativescript_dev_appium_1.nsCapabilities.testReporter) {
                nativescript_dev_appium_1.nsCapabilities.testReporter.context = this;
            }
            driver = yield (0, nativescript_dev_appium_1.createDriver)();
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
            if (driver && this.currentTest && this.currentTest.state === "failed") {
                yield driver.logTestArtifacts(this.currentTest.title);
            }
        });
    });
    it("should log in", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const emailInput = yield driver.findElementByAccessibilityId("loginEmailInput");
            yield emailInput.type(secrets_1.USERNAME);
            const passwordInput = yield driver.findElementByAccessibilityId("loginPasswordInput");
            yield passwordInput.type(secrets_1.PASSWORD);
            yield driver.driver.hideDeviceKeyboard("Done");
            const logInButton = yield driver.findElementByText("Log In", nativescript_dev_appium_1.SearchOptions.exact);
            yield logInButton.click();
            yield driver.wait(5000);
            const stationsHeading = yield driver.findElementByText("FieldKit Stations", nativescript_dev_appium_1.SearchOptions.exact);
            chai_1.assert.isTrue(yield stationsHeading.isDisplayed());
        });
    });
    it("should go to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const stationLink = yield driver.findElementByAccessibilityId("linkToStation0");
            yield stationLink.click();
            yield driver.wait(5000);
            const memoryLabel = yield driver.findElementByText("Memory", nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield memoryLabel.isDisplayed());
        });
    });
    it("should go to data sync view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSyncLink = yield driver.findElementByAccessibilityId("linkToDataSync");
            yield dataSyncLink.click();
            yield driver.wait(2000);
            const layout = yield driver.findElementByAccessibilityId("dataSyncLayout");
            chai_1.assert.isTrue(yield layout.isDisplayed());
        });
    });
    it("should go back to station detail view", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const backButton = yield driver.findElementByAccessibilityId("linkToStations");
            yield backButton.click();
            yield driver.wait(5000);
            const stationLink = yield driver.findElementByAccessibilityId("linkToStation0");
            yield stationLink.click();
            yield driver.wait(5000);
            const memoryLabel = yield driver.findElementByText("Memory", nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield memoryLabel.isDisplayed());
        });
    });
    it("should go to first step of deployment", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const deployButton = yield driver.findElementByAccessibilityId("deployButton");
            yield deployButton.click();
            if (driver.isAndroid) {
                yield driver.wait(5000);
                const allow = yield driver.findElementByText("ALLOW", nativescript_dev_appium_1.SearchOptions.exact);
                yield allow.click();
            }
            else {
                yield driver.wait(10000);
                const allow = yield driver.findElementByAccessibilityId("Allow");
                yield allow.click();
            }
            const map = yield driver.findElementByAccessibilityId("currentLocationMap");
            chai_1.assert.isTrue(yield map.isDisplayed());
        });
    });
    it("should go to second step of deployment", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const nextButton = yield driver.findElementByAccessibilityId("nextButton");
            yield nextButton.click();
            const layout = yield driver.findElementByAccessibilityId("deployNotesLayout");
            chai_1.assert.isTrue(yield layout.isDisplayed());
        });
    });
    it("should add an audio note", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const addNote = yield driver.findElementByAccessibilityId("noteField0");
            yield addNote.click();
            yield driver.wait(5000);
            const addAudio = yield driver.findElementByAccessibilityId("addAudioNote");
            yield addAudio.click();
            const startButton = yield driver.findElementByAccessibilityId("startRecording");
            yield startButton.click();
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
            const savedAudio = yield driver.findElementByAccessibilityId("audioRecording0");
            chai_1.assert.isTrue(yield savedAudio.isDisplayed());
        });
    });
});
