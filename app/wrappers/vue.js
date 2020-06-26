if (TNS_ENV === "test") {
    module.exports = require("vue");
} else {
    module.exports = require("nativescript-vue");
}
