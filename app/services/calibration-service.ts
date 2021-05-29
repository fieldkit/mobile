import _ from "lodash";
import Config from "@/config";
import { Conservify, HttpResponse } from "@/wrappers/networking";
import { QueryStation } from "./query-station";
import { fixupModuleConfiguration, EmptyModuleConfig, ModuleConfiguration } from "@/store/http-types";
import { fk_app as AppProto } from "fk-app-protocol/fk-app";
import { fk_atlas as AtlasProto } from "fk-atlas-protocol/fk-atlas";
import { Buffer } from "buffer";

const log = Config.logger("CalibrationService");

export enum SensorType {}

export interface CalibrationAttempt {
    sensorType: SensorType;
    which: number;
    reference: number;
    compensations: {
        temperature: number | null;
    };
}

export default class CalibrationService {
    constructor(private readonly queryStation: QueryStation, public readonly conservify: Conservify) {}

    public async clearCalibration(address: string): Promise<ModuleConfiguration> {
        const message = AppProto.ModuleHttpQuery.create({
            type: AppProto.ModuleQueryType.MODULE_QUERY_RESET,
        });

        return await this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    public async calibrate(address: string, data: Buffer): Promise<ModuleConfiguration> {
        const message = AppProto.ModuleHttpQuery.create({
            type: AppProto.ModuleQueryType.MODULE_QUERY_CONFIGURE,
            configuration: data,
        });

        return await this.stationQuery(address, message).then((reply) => {
            return this.fixupReply(reply);
        });
    }

    /**
     * Perform a single calibration query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private async stationQuery(url: string, message: AppProto.ModuleHttpQuery): Promise<AppProto.ModuleHttpReply> {
        const binaryQuery = AppProto.ModuleHttpQuery.encodeDelimited(message).finish();
        log.info(url, "calibration querying", message);

        return await this.queryStation.binaryStationQuery(url, binaryQuery, {}).then((response: HttpResponse) => {
            const body = this.getResponseBody(response);
            if (!body) {
                throw new Error(`bad calibration reply`);
            }
            return body;
        });
    }

    private getResponseBody(response: HttpResponse): AppProto.ModuleHttpReply | null {
        if (Buffer.isBuffer(response.body)) {
            try {
                return AppProto.ModuleHttpReply.decodeDelimited(response.body);
            } catch (err) {
                console.log(`error parsing reply:`, response.body);
            }
        }
        return null;
    }

    private fixupReply(reply: AtlasProto.WireAtlasReply | AppProto.ModuleHttpReply): ModuleConfiguration {
        if (reply.errors && reply.errors.length > 0) {
            console.log(`calibration error`, JSON.stringify(reply));
            throw new Error(`calibration error ${JSON.stringify(reply)}`);
        }

        if ((reply as AtlasProto.WireAtlasReply).calibration) {
            const atlasReply = reply as AtlasProto.WireAtlasReply;
            if (!atlasReply.calibration || !atlasReply.calibration.configuration) {
                console.log(`calibration error, no cal`, JSON.stringify(atlasReply));
                throw new Error(`calibration error, no cal ${JSON.stringify(atlasReply)}`);
            }
            const configuration = fixupModuleConfiguration(
                atlasReply.calibration.configuration ? Buffer.from(atlasReply.calibration.configuration) : null
            );

            return configuration || EmptyModuleConfig;
        }

        if ((reply as AppProto.ModuleHttpReply).configuration) {
            const genericReply = reply as AppProto.ModuleHttpReply;
            const configuration = fixupModuleConfiguration(genericReply.configuration ? Buffer.from(genericReply.configuration) : null);

            return configuration || EmptyModuleConfig;
        }

        console.log(`empty module configuration`, reply);

        return EmptyModuleConfig;
    }
}
