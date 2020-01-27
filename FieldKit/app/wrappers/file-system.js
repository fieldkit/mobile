/**
 *
 *
 */
if (TNS_ENV === "test") {
    module.exports = require("./file-system.node");
} else {
    module.exports = require("./file-system.ns");
}
