if (TNS_ENV === "test") {
    module.exports = require("./geolocation.node");
} else {
    module.exports = require("./geolocation.ns");
}
