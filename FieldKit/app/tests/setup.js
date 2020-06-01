import axios from "axios";
import _ from "lodash";

import protobuf from "protobufjs";
import Long from "long";

protobuf.util.Long = null;
protobuf.configure();

window.FK_BUILD_TIMESTAMP = "";
window.FK_BUILD_NUMBER = "";
window.FK_BUILD_TAG = "";
window.FK_GIT_COMMIT = "";
window.FK_GIT_BRANCH = "";

window["__extends"] = _.extend;

jest.mock("axios");
