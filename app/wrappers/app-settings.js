if (TNS_ENV === "test") {
    module.exports = require("./app-settings.node");
} else {
    module.exports = require("./app-settings.ns");
}
