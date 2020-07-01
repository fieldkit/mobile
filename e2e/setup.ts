import { startServer, stopServer, ITestReporter, nsCapabilities, LogImageType } from "nativescript-dev-appium";
import jasmine;
const addContext = require("mochawesome/addContext");

const testReporterContext = <ITestReporter>{};
testReporterContext.name = "mochawesome";
/**
 * This folder should be the one provided in mocha.opts.
 * If omitted the default one is "mochawesome-report".
 * This is necessary because we need the logged images to be relatively
 * positioned according to mochawesome.html in the same folder
 */
testReporterContext.reportDir = "mochawesome-report";
testReporterContext.log = addContext;
testReporterContext.logImageTypes = [LogImageType.screenshots];
nsCapabilities.testReporter = testReporterContext;

before("start server", async function () {
    if (nsCapabilities && nsCapabilities.testReporter) {
        nsCapabilities.testReporter.context = this;
    }
    await startServer();
});

after("stop server", async function () {
    await stopServer();
});
