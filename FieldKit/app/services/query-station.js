import _ from "lodash";
import protobuf from "protobufjs";
import deepmerge from "deepmerge";
import { unixNow, promiseAfter } from "../utilities";
import Config from "../config";
import Services from "./services";

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
                percentage: 0.0
            }
        },
        memory: {
            dataMemoryConsumption: 0
        },
        recording: {
            enabled: false
        },
        gps: {
            latitude: 0,
            longitude: 0
        }
    }
};

export default class QueryStation {
    getStatus(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_STATUS,
			time: unixNow()
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    takeReadings(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_TAKE_READINGS,
			time: unixNow()
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    startDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: true },
			time: unixNow()
        });

        return this.stationQuery(address, message).then(reply => {
            // notify StationMonitor
            Services.StationMonitor().recordingStatusChange(address, "started");
            return this._fixupStatus(reply);
        });
    }

    stopDataRecording(address) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: false }
        });

        return this.stationQuery(address, message).then(reply => {
            // notify StationMonitor
            Services.StationMonitor().recordingStatusChange(address, "stopped");
            return this._fixupStatus(reply);
        });
    }

    setInterval(station) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            schedules: { modifying: true, readings: { interval: station.interval } }
        });

        return this.stationQuery(station.url, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    sendNetworkSettings(address, networks) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            networkSettings: { networks: networks }
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    sendLoraSettings(address, lora) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            loraSettings: { appEui: lora.appEui, appKey: lora.appKey }
        });
        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

    configureName(address, name) {
        const message = HttpQuery.create({
            type: QueryType.values.QUERY_CONFIGURE,
            identity: { name: name }
        });

        return this.stationQuery(address, message).then(reply => {
            return this._fixupStatus(reply);
        });
    }

	calculateDownloadSize(url) {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject("ignored");
        }

		return Services.Conservify().json({
			method: "HEAD",
			url: url,
		}).then(response => {
			const size = Number(response.headers["content-length"]);
			return {
				size
			};
		}, err => {
			log.error(url, "query error", err);
			return Promise.reject(err);
		});
	}

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject("ignored");
        }
        const binaryQuery = HttpQuery.encodeDelimited(message).finish();
        log.info(url, "querying", message);

		return Services.Conservify().protobuf({
			method: "POST",
			url: url,
			body: binaryQuery
		}).then(response => {
			if (response.body.length == 0) {
				log.info(url, "query success", "<empty>");
				return {};
			}

			const decoded = this._getResponseBody(response);
			return this._handlePotentialBusyReply(
				decoded,
				url,
				message
			).then(finalReply => {
				log.verbose(url, "query success", finalReply);
				return finalReply;
			});
		}, err => {
			log.error(url, "query error", err);
			return Promise.reject(err);
		});
	}

	_getResponseBody(response) {
		if (Buffer.isBuffer(response.body)) {
			return HttpReply.decodeDelimited(response.body);
		}
		return response.body;
	}

	_fixupStatus(reply) {
        if (reply.errors && reply.errors.length > 0) {
            return reply;
        }
        // NOTE deepmerge ruins deviceId.
        if (reply.status && reply.status.identity) {
            reply.status.identity.deviceId = new Buffer.from(
                reply.status.identity.deviceId
            ).toString("hex");
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
            return Promise.reject(new Error("busy"));
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
