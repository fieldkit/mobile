import _ from "lodash";
import protobuf from "protobufjs";
import { promiseAfter } from "../utilities";
import Config from "../config";

const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const AtlasQuery = atlasRoot.lookupType("fk_atlas.WireAtlasQuery");
const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply");
const ReplyType = atlasRoot.lookup("fk_atlas.ReplyType");
const AtlasQueryType = atlasRoot.lookup("fk_atlas.QueryType");
const AtlasCalibrationOperation = atlasRoot.lookup("fk_atlas.CalibrationOperation");
const PhCalibrations = atlasRoot.lookup("fk_atlas.PhCalibrations");

const log = Config.logger("CalibrationService");

export default class CalibrationService {
    constructor(services) {
        this.services = services;
    }

    getCalibrationStatus(address) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_STATUS
            }
        });

        return this.stationQuery(address, message).then(reply => {
            return reply;
        });
    }

    clearCalibration(address) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_CLEAR
            }
        });

        return this.stationQuery(address, message).then(reply => {
            return reply;
        });
    }

    calibrateLowPh(address, data) {
        data.which = PhCalibrations.values.PH_LOW;
        return this.performCalibration(address, data);
    }

    calibrateMidPh(address, data) {
        data.which = PhCalibrations.values.PH_MIDDLE;
        return this.performCalibration(address, data);
    }

    calibrateHighPh(address, data) {
        data.which = PhCalibrations.values.PH_HIGH;
        return this.performCalibration(address, data);
    }

    performCalibration(address, data) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_SET,
                which: data.which,
                value: data.refValue
            }
        });
        return this.stationQuery(address, message).then(reply => {
            return reply;
        });
    }

    /**
     * Perform a single calibration query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject("ignored");
        }
        const binaryQuery = AtlasQuery.encodeDelimited(message).finish();
        log.info(url, "calibration querying", message);

        return this.services.Conservify().protobuf({
            method: "POST",
            url: url,
            body: binaryQuery
        }).then(response => {
            if (response.body.length == 0) {
                log.info(url, "calibration query success", "<empty>");
                return {};
            }

            const decoded = this._getResponseBody(response);
            return this._handlePotentialRetryReply(
                decoded,
                url,
                message
            ).then(finalReply => {
                log.verbose(url, "calibration query success", finalReply);
                return finalReply;
            });
        }, err => {
            log.error(url, "calibration query error", err);
            return Promise.reject(err);
        });
    }

    _getResponseBody(response) {
        if (Buffer.isBuffer(response.body)) {
            return AtlasReply.decodeDelimited(response.body);
        }
        return response.body;
    }

    _handlePotentialRetryReply(reply, url, message) {
        if (reply.type != ReplyType.values.REPLY_RETRY) {
            return Promise.resolve(reply);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new Error("busy"));
        }
        return this._retryAfter(delays, url, message);
    }

    _retryAfter(delays, url, message) {
        log.info(url, "retrying calibration query after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
