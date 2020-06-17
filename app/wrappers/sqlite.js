/**
 *
 *
 */
if (TNS_ENV === "test") {
    module.exports = require("./sqlite.node");
} else {
    module.exports = require("./sqlite.ns");
}
