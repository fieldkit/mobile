import _ from "lodash";
import Config from "@/config";
import { Conservify, HttpResponse } from "@/wrappers/networking";
import { QueryStation } from "./query-station";
import { fixupModuleConfiguration, EmptyModuleConfig, ModuleConfiguration } from "@/store/http-types";
import { fk_atlas as AtlasProto } from "fk-atlas-protocol/fk-atlas";
import { Buffer } from "buffer";
export * from "./atlas-types";

const AtlasQuery = AtlasProto.WireAtlasQuery;
const AtlasReply = AtlasProto.WireAtlasReply;
const AtlasQueryType = AtlasProto.QueryType;
const AtlasCalibrationOperation = AtlasProto.CalibrationOperation;

const log = Config.logger("CalibrationService");

export interface CalibrationAttempt {
    sensorType: AtlasProto.SensorType;
    which: number;
    reference: number;
    compensations: {
        temperature: number | null;
    };
}

export default class CalibrationService {
    constructor(private readonly queryStation: QueryStation, public readonly conservify: Conservify) {}

    public async clearCalibration(address: string): Promise<ModuleConfiguration> {
        const message = AtlasQuery.create({
            type: AtlasQueryType.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.CALIBRATION_CLEAR,
            },
        });

        return await this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    public async calibrate(address: string, data: Buffer): Promise<ModuleConfiguration> {
        const message = AtlasQuery.create({
            type: AtlasQueryType.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.CALIBRATION_SET,
                configuration: data,
            },
        });
        return await this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    public calibrateSensor(address: string, data: CalibrationAttempt): Promise<ModuleConfiguration> {
        const message = AtlasQuery.create({
            type: AtlasQueryType.QUERY_NONE,
            calibration: {
                operation: AtlasCalibrationOperation.CALIBRATION_SET,
                which: data.which,
                value: data.reference,
            },
            compensations: {
                temperature: data.compensations.temperature,
            },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    /**
     * Perform a single calibration query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private stationQuery(url: string, message: AtlasProto.WireAtlasQuery): Promise<AtlasProto.WireAtlasReply> {
        const binaryQuery = AtlasQuery.encodeDelimited(message).finish();
        log.info(url, "calibration querying", message);

        return this.queryStation.binaryStationQuery(url, binaryQuery, {}).then((response: HttpResponse) => {
            const body = this.getResponseBody(response);
            if (!body) {
                throw new Error(`bad calibration reply`);
            }
            return body;
        });
    }

    private getResponseBody(response: HttpResponse): AtlasProto.WireAtlasReply | null {
        if (Buffer.isBuffer(response.body)) {
            try {
                return AtlasReply.decodeDelimited(response.body);
            } catch (err) {
                console.log(`error parsing reply:`, response.body);
            }
        }
        return null;
    }

    private fixupReply(reply: AtlasProto.WireAtlasReply): ModuleConfiguration {
        if (reply.errors && reply.errors.length > 0) {
            console.log(`calibration error`, JSON.stringify(reply));
            throw new Error(`calibration error ${JSON.stringify(reply)}`);
        }

        if (!reply.calibration || !reply.calibration.configuration) {
            console.log(`calibration error, no cal`, JSON.stringify(reply));
            throw new Error(`calibration error, no cal ${JSON.stringify(reply)}`);
        }

        const configuration = fixupModuleConfiguration(
            reply.calibration.configuration ? Buffer.from(reply.calibration.configuration) : null
        );

        return configuration || EmptyModuleConfig;
    }
}
