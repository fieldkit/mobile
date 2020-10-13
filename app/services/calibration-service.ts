import _ from "lodash";
import Config from "@/config";
import { promiseAfter } from "@/utilities";
import { AtlasSensorType } from "@/calibration";
import { fixupCalibrationStatus } from "@/store/http_reply";
import { fk_atlas } from "fk-atlas-protocol/fk-atlas";

const AtlasQuery = fk_atlas.WireAtlasQuery;
const AtlasReply = fk_atlas.WireAtlasReply;
const ReplyType = fk_atlas.ReplyType;
const SensorType = fk_atlas.SensorType;
const AtlasQueryType = fk_atlas.QueryType;
const AtlasCalibrationOperation = fk_atlas.CalibrationOperation;
const PhCalibrationsCommand = fk_atlas.PhCalibrateCommand;
const EcCalibrationsCommand = fk_atlas.EcCalibrateCommand;

const replyTypeLookup = _.invert(ReplyType);
const sensorTypeLookup = _.invert(SensorType);

const log = Config.logger("CalibrationService");

export interface CalibrationAttempt {
    sensorType: AtlasSensorType;
    which: number;
    reference: number;
    compensations: {
        temperature: number | null;
    };
}

export default class CalibrationService {
    constructor(private readonly conservify: any) {}

    public clearCalibration(address) {
        const message = AtlasQuery.create({
            type: AtlasQueryType.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.CALIBRATION_CLEAR,
            },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    private applyCompensation(data: CalibrationAttempt): number {
        switch (data.sensorType) {
            case AtlasSensorType.None: {
                break;
            }
            case AtlasSensorType.Ph: {
                switch (data.which) {
                    case PhCalibrationsCommand.CALIBRATE_PH_MIDDLE: {
                        return this.getQuickPhRef(data.compensations.temperature);
                    }
                    case PhCalibrationsCommand.CALIBRATE_PH_LOW: {
                        return this.getLowPhRef(data.compensations.temperature);
                    }
                    case PhCalibrationsCommand.CALIBRATE_PH_MIDDLE: {
                        return this.getMidPhRef(data.compensations.temperature);
                    }
                    case PhCalibrationsCommand.CALIBRATE_PH_HIGH: {
                        return this.getHighPhRef(data.compensations.temperature);
                    }
                }
                break;
            }
            case AtlasSensorType.Temp: {
                break;
            }
            case AtlasSensorType.Orp: {
                break;
            }
            case AtlasSensorType.Do: {
                break;
            }
            case AtlasSensorType.Ec: {
                switch (data.which) {
                    case EcCalibrationsCommand.CALIBRATE_EC_DRY: {
                        return this.getDryEcRef(data.compensations.temperature);
                    }
                    case EcCalibrationsCommand.CALIBRATE_EC_SINGLE: {
                        return this.getLowEcRef(data.compensations.temperature);
                    }
                    case EcCalibrationsCommand.CALIBRATE_EC_DUAL_LOW: {
                        return this.getLowEcRef(data.compensations.temperature);
                    }
                    case EcCalibrationsCommand.CALIBRATE_EC_DUAL_HIGH: {
                        return this.getHighEcRef(data.compensations.temperature);
                    }
                }
                break;
            }
        }
        return data.reference;
    }

    public calibrateSensor(address: string, data: CalibrationAttempt) {
        const adjusted = this.applyCompensation(data);
        const message = AtlasQuery.create({
            type: AtlasQueryType.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.CALIBRATION_SET,
                which: data.which,
                value: adjusted,
            },
            compensations: {
                temperature: data.compensations.temperature,
            },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
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
    private stationQuery(url: string, message: any) {
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
                    console.log("cal:response", response);
                    console.log("cal:response", response.body);
                    console.log("cal:response", response.info);

                    if (response && response.body && response.body.length == 0) {
                        log.info(url, "calibration query success", "<empty>");
                        return {};
                    }

                    const decoded = this.getResponseBody(response);
                    return this.handlePotentialRetryReply(decoded, url, message).then((finalReply) => {
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

    private getResponseBody(response): fk_atlas.WireAtlasReply | any | null {
        if (Buffer.isBuffer(response.body)) {
            return AtlasReply.toObject(AtlasReply.decodeDelimited(response.body), {
                enums: Number,
            });
        }
        return response.body;
    }

    private fixupReply(reply) {
        if (reply.errors && reply.errors.length > 0) {
            return reply;
        }

        reply.typeName = replyTypeLookup[reply.type];
        if (reply.calibration) {
            reply.calibration.typeName = sensorTypeLookup[reply.calibration.type];
            reply = fixupCalibrationStatus(reply);
        }
        return reply;
    }

    private handlePotentialRetryReply(reply: any | null, url: string, message) {
        if (reply.type != ReplyType.REPLY_RETRY) {
            return Promise.resolve(reply);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new Error("busy"));
        }
        return this.retryAfter(delays, url, message);
    }

    private retryAfter(delays, url: string, message) {
        log.info(url, "retrying calibration query after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
