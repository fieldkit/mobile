import _ from "lodash";
import protobuf from "protobufjs";
import deepmerge from "deepmerge";
import { unixNow, promiseAfter } from "../utilities";
import { EventHistory } from "./event-history";
import { QueryThrottledError, StationQueryError, HttpError } from "../lib/errors";
import Config from "../config";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpQuery = appRoot.lookupType("fk_app.HttpQuery");
const HttpReply = appRoot.lookupType("fk_app.HttpReply");
const QueryType = appRoot.lookup("fk_app.QueryType");
const ReplyType = appRoot.lookup("fk_app.ReplyType");

const log = Config.logger("QueryStation");

const MandatoryStatus = {
    status: {
        identity: {},
        power: {
            battery: {
                percentage: 0.0,
            },
        },
        memory: {
            dataMemoryConsumption: 0,
        },
        recording: {
            enabled: false,
        },
        gps: {
            latitude: 0,
            longitude: 0,
        },
    },
};

export default class QueryStation {
    constructor(services) {
        this._conservify = services.Conservify();
        this._history = new EventHistory(services.Database());
        this._openQueries = {};
        this._lastQueries = {};
        this._lastQueryTried = {};
    }

    getStatus(address, locate) {
        let message;
        if (locate) {
            message = HttpQuery.create({
                type: QueryType.values.QUERY_STATUS,
                time: unixNow(),
                locate: {
                    modifying: true,
                    longitude: locate.long,
                    latitude: locate.lat,
                    time: locate.time,
                },
            });
        } else {
            message = HttpQuery.create({
                type: QueryType.values.QUERY_STATUS,
                time: unixNow(),
            });
        }

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    takeReadings(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_TAKE_READINGS,
            time: unixNow(),
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    startDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: true },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    stopDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: false },
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    setStationInterval(station) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            schedules: { modifying: true, readings: { interval: station.interval } },
            time: unixNow(),
        });

        return this.stationQuery(station.url, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    setStationUploadSchedule(station) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            schedules: { modifying: true, network: { duration: station.uploadSchedule } },
            time: unixNow(),
        });

        return this.stationQuery(station.url, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    sendNetworkSettings(address, networks) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            networkSettings: { networks: networks },
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    sendLoraSettings(address, lora) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            loraSettings: { appEui: lora.appEui, appKey: lora.appKey },
        });
        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    configureName(address, name) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            identity: { name: name },
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    calculateDownloadSize(url) {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject(new StationQueryError("ignored"));
        }

        return this._trackActivity(url, () => {
            return this._conservify
                .json({
                    method: "HEAD",
                    url: url,
                })
                .then(
                    response => {
                        if (response.statusCode != 204) {
                            return Promise.reject(new HttpError("status", response));
                        }
                        const size = Number(response.headers["content-length"]);
                        return {
                            size,
                        };
                    },
                    err => {
                        log.error(url, "query error", err);
                        return Promise.reject(err);
                    }
                );
        });
    }

    queryLogs(url) {
        return this._trackActivity(url, () => {
            return this._conservify
                .text({
                    url: url + "/download/logs",
                })
                .then(
                    response => {
                        return response.body;
                    },
                    err => {
                        log.error(url, "query error", err);
                        return Promise.reject(err);
                    }
                );
        });
    }

    download(url, path, progress) {
        return this._trackActivity(url, () => {
            return this._conservify
                .download({
                    method: "GET",
                    url: url,
                    path: path,
                    progress: prgoress,
                })
                .then(response => {
                    log.info("headers", response.headers);
                    log.info("status", response.statusCode);
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                });
        });
    }

    uploadFirmware(url, path, progress) {
        return this._trackActivity(url, () => {
            return this._conservify
                .upload({
                    method: "POST",
                    url: url + "/upload/firmware?swap=1",
                    path: path,
                    progress: progress,
                })
                .then(response => {
                    console.log(response);
                    return {};
                });
        });
    }

    uploadViaApp(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    enabled: false,
                },
            },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    uploadOverWifi(address, transmissionUrl, transmissionToken) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    url: transmissionUrl,
                    token: transmissionToken,
                    enabled: true,
                },
            },
            schedules: { modifying: true, network: { duration: 0xffffffff } },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    _urlToStationKey(url) {
        // http://192.168.0.100:2380/fk/v1 -> http://192.168.0.100:2380/fk
        return url.replace(/\/v1.*/, "");
    }

    ifLastQueriedBefore(url, window) {
        return Promise.resolve(0);
    }

    _trackActivity(url, factory) {
        const stationKey = this._urlToStationKey(url);
        if (this._openQueries[stationKey] === true) {
            return Promise.reject(new QueryThrottledError("throttled"));
        }
        this._openQueries[stationKey] = true;
        this._lastQueryTried[stationKey] = new Date();

        return factory().then(
            value => {
                this._openQueries[stationKey] = false;
                this._lastQueries[stationKey] = new Date();
                return value;
            },
            error => {
                this._openQueries[stationKey] = false;
                return Promise.reject(error);
            }
        );
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        return this._trackActivity(url, () => {
            if (!Config.developer.stationFilter(url)) {
                return Promise.reject(new StationQueryError("ignored"));
            }

            const binaryQuery = HttpQuery.encodeDelimited(message).finish();
            log.info(url, "querying", message);

            return this._conservify
                .protobuf({
                    method: "POST",
                    url: url,
                    body: binaryQuery,
                })
                .then(
                    response => response,
                    err => {
                        log.error(url, "query error");
                        return Promise.reject(err);
                    }
                );
        }).then(response => {
            if (response.body.length == 0) {
                log.info(url, "query success", "<empty>");
                return {};
            }

            const decoded = this._getResponseBody(response);
            return this._history.onStationReply(decoded).then(() => {
                return this._handlePotentialBusyReply(decoded, url, message).then(finalReply => {
                    log.verbose(url, "query success", finalReply);
                    return finalReply;
                });
            });
        });
    }

    _getResponseBody(response) {
        if (Buffer.isBuffer(response.body)) {
            const decoded = HttpReply.decodeDelimited(response.body);
            decoded.serialized = response.body.toString("base64");
            return decoded;
        }
        return response.body;
    }

    _fixupStatus(reply) {
        if (reply.errors && reply.errors.length > 0) {
            return reply;
        }
        // NOTE deepmerge ruins deviceId.
        if (reply.status && reply.status.identity) {
            reply.status.identity.deviceId = new Buffer.from(reply.status.identity.deviceId).toString("hex");
            reply.status.identity.generationId = new Buffer.from(reply.status.identity.generation).toString("hex");
        }
        if (reply.modules && Array.isArray(reply.modules)) {
            reply.modules.map(m => {
                m.deviceId = new Buffer.from(m.id).toString("hex");
            });
        }
        if (reply.streams && reply.streams.length > 0) {
            reply.streams.forEach(s => {
                s.block = s.block ? s.block : 0;
                s.size = s.size ? s.size : 0;
            });
        }

        return deepmerge.all([MandatoryStatus, reply]);
    }

    _handlePotentialBusyReply(reply, url, message) {
        if (reply.type != ReplyType.values.REPLY_BUSY) {
            return Promise.resolve(reply);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new StationQueryError("busy"));
        }
        return this._retryAfter(delays, url, message);
    }

    _retryAfter(delays, url, message) {
        log.info(url, "retrying after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
