/**
 *
 *
 */
if (TNS_ENV === "test") {
    module.exports = require("./networking.node");
} else {
    module.exports = require("./networking.ns");
}
