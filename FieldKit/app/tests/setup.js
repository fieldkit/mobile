import axios from "axios";
import _ from "lodash";

window.FK_BUILD_TIMESTAMP = "";
window.FK_BUILD_NUMBER = "";
window.FK_BUILD_TAG = "";
window.FK_GIT_COMMIT = "";
window.FK_GIT_BRANCH = "";

window["__extends"] = _.extend;

jest.mock("axios");
