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
describe("LoginView", () => {
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
    it("should find password element by accessibility id", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const input = yield driver.findElementByAccessibilityId('loginPasswordInput');
            chai_1.assert.isTrue(yield input.isDisplayed());
        });
    });
    it("should log in", function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (driver.isAndroid) {
                const allFields = yield driver.driver.waitForElementsByClassName(driver.locators.getElementByName("textfield"), 10000);
                yield allFields[1].click().sendKeys(secrets_1.PASSWORD);
                yield allFields[0].click().sendKeys(secrets_1.USERNAME);
            }
            else {
                // const passField = await driver.driver.waitForElementByClassName(driver.locators.getElementByName("securetextfield"), 10000);
                // await passField.click().sendKeys(PASSWORD);
                // const usernameField = await driver.driver.waitForElementByClassName(driver.locators.getElementByName("textfield"), 10000);
                // await usernameField.click().sendKeys(USERNAME);
            }
            yield driver.driver.hideDeviceKeyboard("Done");
            if (driver.isAndroid) {
                const logInButton = yield driver.findElementByText('Log In', nativescript_dev_appium_1.SearchOptions.exact);
                yield logInButton.click();
            }
            else {
                // const logInButton = await driver.findElementByXPath("//" + driver.locators.button + loginButtonElement);
                // await logInButton.click();
                // const continueButton = await driver.findElementByXPath("//" + driver.locators.button + continueButtonAttribute);
                // await continueButton.click();
            }
            const authenticatedMessage = yield driver.findElementByText('authenticated', nativescript_dev_appium_1.SearchOptions.contains);
            chai_1.assert.isTrue(yield authenticatedMessage.isDisplayed());
        });
    });
});
