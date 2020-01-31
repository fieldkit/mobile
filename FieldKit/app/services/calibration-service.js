import _ from "lodash";
import protobuf from "protobufjs";
import { promiseAfter } from "../utilities";
import Config from "../config";

const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const AtlasQuery = atlasRoot.lookupType("fk_atlas.WireAtlasQuery");
const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply");
const ReplyType = atlasRoot.lookup("fk_atlas.ReplyType");
const replyTypeLookup = _.invert(ReplyType.values);
const SensorType = atlasRoot.lookup("fk_atlas.SensorType");
const sensorTypeLookup = _.invert(SensorType.values);
const AtlasQueryType = atlasRoot.lookup("fk_atlas.QueryType");
const AtlasCalibrationOperation = atlasRoot.lookup("fk_atlas.CalibrationOperation");
// const TempCalibrations = atlasRoot.lookup("fk_atlas.TempCalibrations");
const DoCalibrations = atlasRoot.lookup("fk_atlas.DoCalibrations");
const PhCalibrations = atlasRoot.lookup("fk_atlas.PhCalibrations");
const EcCalibrations = atlasRoot.lookup("fk_atlas.EcCalibrations");
// const OrpCalibrations = atlasRoot.lookup("fk_atlas.OrpCalibrations");

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
            return this._fixupReply(reply);
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
            return this._fixupReply(reply);
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

    calibrateDryConductivity(address, data) {
        data.which = EcCalibrations.values.EC_DRY;
        return this.performCalibration(address, data);
    }

    calibrateSingleConductivity(address, data) {
        data.which = EcCalibrations.values.EC_SINGLE;
        return this.performCalibration(address, data);
    }

    calibrateDualLowConductivity(address, data) {
        data.which = EcCalibrations.values.EC_DUAL_LOW;
        return this.performCalibration(address, data);
    }

    calibrateDualHighConductivity(address, data) {
        data.which = EcCalibrations.values.EC_DUAL_HIGH;
        return this.performCalibration(address, data);
    }

    calibrateAtmosphereDissolvedOxygen(address, data) {
        data.which = DoCalibrations.values.DO_ATMOSPHERE;
        return this.performCalibration(address, data);
    }

    calibrateZeroDissolvedOxygen(address, data) {
        data.which = DoCalibrations.values.DO_ZERO;
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
            return this._fixupReply(reply);
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

    _fixupReply(reply) {
        if (reply.errors && reply.errors.length > 0) {
            return reply;
        }

        reply.typeName = replyTypeLookup[reply.type];

        if (reply.calibration) {
            reply.calibration.typeName = sensorTypeLookup[reply.calibration.type];
            switch (reply.calibration.type) {
                case SensorType.values.SENSOR_NONE:
                    break;
                case SensorType.values.SENSOR_PH:
                    reply.calibration.phStatus = {
                        low: reply.calibration["ph"] & PhCalibrations.values.PH_LOW,
                        middle: reply.calibration["ph"] & PhCalibrations.values.PH_MIDDLE,
                        high: reply.calibration["ph"] & PhCalibrations.values.PH_HIGH
                    }
                    break;
                case SensorType.values.SENSOR_TEMP:
                    break;
                case SensorType.values.SENSOR_ORP:
                    break;
                case SensorType.values.SENSOR_DO:
                    break;
                case SensorType.values.SENSOR_EC:
                    break;
                default:
                    break;
            }
        }
        return reply;
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
