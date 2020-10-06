import _ from "lodash";
import protobuf from "protobufjs";
import { unixNow, promiseAfter } from "../utilities";
import { QueryThrottledError, StationQueryError, HttpError } from "../lib/errors";
import { PhoneLocation } from "../store/types";
import Config from "../config";

import { prepareReply } from "../store/http_reply";

// const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
// const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply");
const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpQuery: any = appRoot.lookupType("fk_app.HttpQuery");
const HttpReply: any = appRoot.lookupType("fk_app.HttpReply");
const QueryType: any = appRoot.lookup("fk_app.QueryType");
const ReplyType: any = appRoot.lookup("fk_app.ReplyType");

export class CalculatedSize {
    constructor(public readonly size: number) {}
}

export interface TrackActivityOptions {
    url: string;
    throttle: boolean;
}

const log = Config.logger("QueryStation");

export default class QueryStation {
    _conservify: any;
    _openQueries: any = {};
    _lastQueries: any = {};
    _lastQueryTried: any = {};

    constructor(services) {
        this._conservify = services.Conservify();
    }

    private buildLocateMessage(queryType: number, locate: PhoneLocation) {
        if (locate) {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
                locate: {
                    modifying: true,
                    longitude: locate.longitude,
                    latitude: locate.latitude,
                    time: locate.time,
                },
            });
        } else {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
            });
        }
    }

    getStatus(address: string, locate: PhoneLocation) {
        const message = this.buildLocateMessage(QueryType.values.QUERY_STATUS, locate);
        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    takeReadings(address: string, locate: PhoneLocation) {
        const message = this.buildLocateMessage(QueryType.values.QUERY_TAKE_READINGS, locate);
        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    startDataRecording(address: string) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: true },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    stopDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: false },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    public scanNearbyNetworks(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_SCAN_NETWORKS,
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    public configureSchedule(address, schedule) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            schedules: { modifying: true, ...schedule },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    sendNetworkSettings(address, networks) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            networkSettings: { networks: networks },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    sendLoraSettings(address, lora) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            loraSettings: { appEui: lora.appEui, appKey: lora.appKey },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    configureName(address, name) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            identity: { name: name },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    calculateDownloadSize(url): Promise<CalculatedSize> {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject(new StationQueryError("ignored"));
        }

        return this._trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .json({
                    method: "HEAD",
                    url: url,
                })
                .then(
                    (response) => {
                        if (response.statusCode != 204) {
                            return Promise.reject(new HttpError("status", response));
                        }
                        const size = Number(response.headers["content-length"]);
                        return new CalculatedSize(size);
                    },
                    (err) => {
                        if (false) {
                            console.log(url, "query error", err, err ? err.stack : null);
                        } else {
                            console.log(url, "query error", err.message);
                        }
                        return Promise.reject(err);
                    }
                );
        });
    }

    queryLogs(url) {
        return this._trackActivityAndThrottle(url, () => {
            return this._conservify
                .text({
                    url: url + "/download/logs",
                })
                .then(
                    (response) => {
                        return response.body;
                    },
                    (err) => {
                        if (false) {
                            console.log(url, "query error", err, err ? err.stack : null);
                        } else {
                            console.log(url, "query error", err.message);
                        }
                        return Promise.reject(err);
                    }
                );
        });
    }

    download(url, path, progress) {
        return this._trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .download({
                    method: "GET",
                    url: url,
                    path: path,
                    progress: progress,
                })
                .then((response) => {
                    // log.info("headers", response.headers);
                    // log.info("status", response.statusCode);
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                });
        });
    }

    uploadFirmware(url, path, progress) {
        return this._trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .upload({
                    method: "POST",
                    url: url + "/upload/firmware?swap=1",
                    path: path,
                    progress: progress,
                })
                .then((response) => {
                    const body = JSON.parse(response.body);
                    console.log("upload-firmware:", body);
                    return body;
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

        return this.stationQuery(address, message).then((reply) => {
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

        return this.stationQuery(address, message).then((reply) => {
            return this._fixupStatus(reply);
        });
    }

    _urlToStationKey(url: string) {
        if (!url) throw new Error("no station url");
        // http://192.168.0.100:2380/fk/v1 -> http://192.168.0.100:2380/fk
        return url.replace(/\/v1.*/, "");
    }

    ifLastQueriedBefore(url, window) {
        return Promise.resolve(0);
    }

    private readonly queued: { [index: string]: any } = {};

    private _trackActivity(options: TrackActivityOptions, factory) {
        const stationKey = this._urlToStationKey(options.url);
        if (this._openQueries[stationKey] === true) {
            if (options.throttle) {
                console.log(options.url, "throttle");
                return Promise.reject(new QueryThrottledError("throttled"));
            }
            return new Promise((resolve) => {
                console.log(options.url, "queuing station query");
                this.queued[stationKey] = resolve;
            }).then(() => {
                return this._trackActivity(options, factory);
            });
        }
        this._openQueries[stationKey] = true;
        this._lastQueryTried[stationKey] = new Date();

        return factory()
            .then(
                (value) => {
                    this._openQueries[stationKey] = false;
                    this._lastQueries[stationKey] = new Date();
                    return value;
                },
                (error) => {
                    this._openQueries[stationKey] = false;
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                if (this.queued[stationKey]) {
                    console.log("resuming");
                    const resume = this.queued[stationKey];
                    delete this.queued[stationKey];
                    resume();
                }
            });
    }

    private _trackActivityAndThrottle(url, factory) {
        return this._trackActivity({ url: url, throttle: true }, factory);
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        return this._trackActivityAndThrottle(url, () => {
            if (!Config.developer.stationFilter(url)) {
                return Promise.reject(new StationQueryError("ignored"));
            }

            const binaryQuery = HttpQuery.encodeDelimited(message).finish();
            log.info(url, "querying", JSON.stringify(message));

            return this._conservify
                .protobuf({
                    method: "POST",
                    url: url,
                    body: binaryQuery,
                    connectionTimeout: 3,
                })
                .then(
                    (response) => response,
                    (err) => {
                        if (false) {
                            console.log(url, "query error", err, err ? err.stack : null);
                        } else {
                            console.log(url, "query error", err.message);
                        }
                        return Promise.reject(err);
                    }
                );
        }).then((response) => {
            if (response.body.length == 0) {
                log.info(url, "query success", "<empty>");
                return {};
            }

            const decoded = this._getResponseBody(response);
            return this._handlePotentialBusyReply(decoded, url, message).then((finalReply) => {
                log.verbose(url, "query success", finalReply);
                return finalReply;
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
        return prepareReply(reply);
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
