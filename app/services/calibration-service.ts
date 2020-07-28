import _ from "lodash";
import protobuf from "protobufjs";
import { promiseAfter } from "../utilities";
import Config from "../config";

const atlasRoot: any = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
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
const DoCalibrationsCommand = atlasRoot.lookup("fk_atlas.DoCalibrateCommand");
const PhCalibrationsCommand = atlasRoot.lookup("fk_atlas.PhCalibrateCommand");
const EcCalibrationsCommand = atlasRoot.lookup("fk_atlas.EcCalibrateCommand");
// const OrpCalibrations = atlasRoot.lookup("fk_atlas.OrpCalibrations");

const log = Config.logger("CalibrationService");

function numberOfOnes(n) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

export function fixupStatus(reply) {
    switch (reply.calibration.type) {
        case SensorType.values.SENSOR_PH:
            reply.calibration.total = numberOfOnes(reply.calibration.ph);
            reply.calibration.phStatus = {
                low: reply.calibration.ph & PhCalibrations.values.PH_LOW,
                middle: reply.calibration.ph & PhCalibrations.values.PH_MIDDLE,
                high: reply.calibration.ph & PhCalibrations.values.PH_HIGH,
            };
            break;
        case SensorType.values.SENSOR_TEMP:
            reply.calibration.total = numberOfOnes(reply.calibration.temp);
            reply.calibration.tempStatus = {};
            break;
        case SensorType.values.SENSOR_ORP:
            reply.calibration.total = numberOfOnes(reply.calibration.orp);
            reply.calibration.orpStatus = {};
            break;
        case SensorType.values.SENSOR_DO:
            reply.calibration.total = numberOfOnes(reply.calibration.dissolvedOxygen);
            reply.calibration.doStatus = {
                atm: reply.calibration.dissolvedOxygen & DoCalibrations.values.DO_ATMOSPHERE,
                zero: reply.calibration.dissolvedOxygen & DoCalibrations.values.DO_ZERO,
            };
            break;
        case SensorType.values.SENSOR_EC:
            reply.calibration.total = numberOfOnes(reply.calibration.ec);
            reply.calibration.ecStatus = {
                dry: reply.calibration.ec & EcCalibrations.values.EC_DRY,
                single: reply.calibration.ec & EcCalibrations.values.EC_SINGLE,
                low: reply.calibration.ec & EcCalibrations.values.EC_DUAL_LOW,
                high: reply.calibration.ec & EcCalibrations.values.EC_DUAL_HIGH,
            };
            break;
        case SensorType.values.SENSOR_NONE:
            break;
        default:
            console.warn("unexpected calibration type");
            break;
    }

    return reply;
}

export default class CalibrationService {
    constructor(private readonly conservify: any) {}

    protected getCalibrationStatus(address) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_STATUS,
            },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupReply(reply);
        });
    }

    public clearCalibration(address) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_CLEAR,
            },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupReply(reply);
        });
    }

    protected calibrateQuickPh(address, data) {
        data.which = PhCalibrationsCommand.values.CALIBRATE_PH_MIDDLE;
        data.refValue = this.getQuickPhRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateLowPh(address, data) {
        data.which = PhCalibrationsCommand.values.CALIBRATE_PH_LOW;
        data.refValue = this.getLowPhRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateMidPh(address, data) {
        data.which = PhCalibrationsCommand.values.CALIBRATE_PH_MIDDLE;
        data.refValue = this.getMidPhRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateHighPh(address, data) {
        data.which = PhCalibrationsCommand.values.CALIBRATE_PH_HIGH;
        data.refValue = this.getHighPhRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateDryConductivity(address, data) {
        data.which = EcCalibrationsCommand.values.CALIBRATE_EC_DRY;
        data.refValue = this.getDryEcRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateSingleConductivity(address, data) {
        data.which = EcCalibrationsCommand.values.CALIBRATE_EC_SINGLE;
        data.refValue = this.getLowEcRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateDualLowConductivity(address, data) {
        data.which = EcCalibrationsCommand.values.CALIBRATE_EC_DUAL_LOW;
        data.refValue = this.getLowEcRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateDualHighConductivity(address, data) {
        data.which = EcCalibrationsCommand.values.CALIBRATE_EC_DUAL_HIGH;
        data.refValue = this.getHighEcRef(data.temp);
        return this.performCalibration(address, data);
    }

    protected calibrateAtmosphereDissolvedOxygen(address, data) {
        data.which = DoCalibrationsCommand.values.CALIBRATE_DO_ATMOSPHERE;
        data.refValue = 0;
        return this.performCalibration(address, data);
    }

    protected calibrateZeroDissolvedOxygen(address, data) {
        data.which = DoCalibrationsCommand.values.CALIBRATE_DO_ZERO;
        data.refValue = 0;
        return this.performCalibration(address, data);
    }

    public calibrateSensor(address, data) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_SET,
                which: data.which,
                value: data.reference,
            },
            compensations: {
                temperature: data.compensations.temp,
            },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this._fixupReply(reply);
        });
    }

    protected performCalibration(address, data) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.values.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.values.CALIBRATION_SET,
                which: data.which,
                value: data.refValue,
            },
            compensations: {
                temperature: data.temperature,
            },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this._fixupReply(reply);
        });
    }

    protected getDryEcRef(temp) {
        return 0;
    }

    protected getLowEcRef(temp) {
        let ref = 12880;
        if (temp <= 5) {
            ref = 8220;
        } else if (temp <= 10) {
            ref = 9330;
        } else if (temp <= 15) {
            ref = 10480;
        } else if (temp <= 20) {
            ref = 11670;
        } else if (temp <= 25) {
            ref = 12880;
        } else if (temp <= 30) {
            ref = 14120;
        } else if (temp <= 35) {
            ref = 15550;
        } else if (temp <= 40) {
            ref = 16880;
        } else if (temp <= 45) {
            ref = 18210;
        } else {
            ref = 19550;
        }
        return ref;
    }

    protected getHighEcRef(temp) {
        let ref = 80000;
        if (temp <= 5) {
            ref = 53500;
        } else if (temp <= 10) {
            ref = 59600;
        } else if (temp <= 15) {
            ref = 65400;
        } else if (temp <= 20) {
            ref = 72400;
        } else if (temp <= 25) {
            ref = 80000;
        } else if (temp <= 30) {
            ref = 88200;
        } else if (temp <= 35) {
            ref = 96400;
        } else if (temp <= 40) {
            ref = 104600;
        } else if (temp <= 45) {
            ref = 112800;
        } else {
            ref = 121000;
        }
        return ref;
    }

    protected getQuickPhRef(temp) {
        let ref = 6.86;
        if (temp <= 10) {
            ref = 6.92;
        } else if (temp <= 15) {
            ref = 6.9;
        } else if (temp <= 20) {
            ref = 6.88;
        } else if (temp <= 25) {
            ref = 6.86;
        } else {
            ref = 6.85;
        }
        return ref;
    }

    protected getLowPhRef(temp) {
        let ref = 4;
        if (temp <= 5) {
            ref = 4;
        } else if (temp <= 10) {
            ref = 4;
        } else if (temp <= 15) {
            ref = 4;
        } else if (temp <= 20) {
            ref = 4;
        } else if (temp <= 25) {
            ref = 4;
        } else if (temp <= 30) {
            ref = 4.01;
        } else if (temp <= 35) {
            ref = 4.02;
        } else if (temp <= 40) {
            ref = 4.03;
        } else if (temp <= 45) {
            ref = 4.04;
        } else {
            ref = 4.05;
        }
        return ref;
    }

    protected getMidPhRef(temp) {
        let ref = 7;
        if (temp <= 5) {
            ref = 7.09;
        } else if (temp <= 10) {
            ref = 7.06;
        } else if (temp <= 15) {
            ref = 7.04;
        } else if (temp <= 20) {
            ref = 7.02;
        } else if (temp <= 25) {
            ref = 7.0;
        } else if (temp <= 30) {
            ref = 6.99;
        } else if (temp <= 35) {
            ref = 6.98;
        } else if (temp <= 40) {
            ref = 6.97;
        } else if (temp <= 45) {
            ref = 6.97;
        } else {
            ref = 6.96;
        }
        return ref;
    }

    protected getHighPhRef(temp) {
        let ref = 10;
        if (temp <= 5) {
            ref = 10.25;
        } else if (temp <= 10) {
            ref = 10.18;
        } else if (temp <= 15) {
            ref = 10.12;
        } else if (temp <= 20) {
            ref = 10.06;
        } else if (temp <= 25) {
            ref = 10.0;
        } else if (temp <= 30) {
            ref = 9.96;
        } else if (temp <= 35) {
            ref = 9.92;
        } else if (temp <= 40) {
            ref = 9.88;
        } else if (temp <= 45) {
            ref = 9.85;
        } else {
            ref = 9.82;
        }
        return ref;
    }

    /**
     * Perform a single calibration query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private stationQuery(url, message) {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject("ignored");
        }
        const binaryQuery = AtlasQuery.encodeDelimited(message).finish();
        log.info(url, "calibration querying", message);

        return this.conservify
            .protobuf({
                method: "POST",
                url: url,
                body: binaryQuery,
            })
            .then(
                (response) => {
                    if (response.body.length == 0) {
                        log.info(url, "calibration query success", "<empty>");
                        return {};
                    }

                    const decoded = this._getResponseBody(response);
                    return this._handlePotentialRetryReply(decoded, url, message).then((finalReply) => {
                        log.info(url, "calibration query success", finalReply);
                        return finalReply;
                    });
                },
                (err) => {
                    log.error(url, "calibration query error", err);
                    return Promise.reject(err);
                }
            );
    }

    private _getResponseBody(response) {
        if (Buffer.isBuffer(response.body)) {
            return AtlasReply.toObject(AtlasReply.decodeDelimited(response.body), {
                enums: Number,
            });
        }
        return response.body;
    }

    private _fixupReply(reply) {
        if (reply.errors && reply.errors.length > 0) {
            return reply;
        }

        reply.typeName = replyTypeLookup[reply.type];
        if (reply.calibration) {
            reply.calibration.typeName = sensorTypeLookup[reply.calibration.type];
            reply = fixupStatus(reply);
        }
        return reply;
    }

    private _handlePotentialRetryReply(reply, url, message) {
        if (reply.type != ReplyType.values.REPLY_RETRY) {
            return Promise.resolve(reply);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new Error("busy"));
        }
        return this._retryAfter(delays, url, message);
    }

    private _retryAfter(delays, url, message) {
        log.info(url, "retrying calibration query after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
