/**
 *
 *
 */
if (window["__ENV__"] === "test") {
    module.exports = require('./sqlite.node');
}
else {
    module.exports = require('./sqlite.ns');
}
