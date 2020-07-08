import axios from "axios";
import _ from "lodash";

import protobuf from "protobufjs";
import Long from "long";

import Vue from "vue";
import Vuex from "vuex";

protobuf.util.Long = null;
protobuf.configure();

window.FK_BUILD_TIMESTAMP = "";
window.FK_BUILD_NUMBER = "";
window.FK_BUILD_TAG = "";
window.FK_GIT_COMMIT = "";
window.FK_GIT_BRANCH = "";

Vue.use(Vuex);

window["__extends"] = _.extend;

window._L = function (key) {
    return "unknown";
};

jest.mock("axios");
