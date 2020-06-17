if (TNS_ENV === "test") {
    module.exports = require("./connectivity.node");
} else {
    module.exports = require("./connectivity.ns");
}
