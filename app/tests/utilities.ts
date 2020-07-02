import protobuf from "protobufjs";
import crypto from "crypto";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpReply = appRoot.lookupType("fk_app.HttpReply");

const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply");

export function randomHexString() {
    return crypto.randomBytes(16).toString("hex");
}

export class MockStationReplies {
    services: any;
    now: number;
    call: any;
    download: any;
    mock: any;
    downloadMock: any;

    constructor(services) {
        this.services = services;
        this.now = 0;

        this.call = jest.fn(() => {
            console.log("TESTS: no more mocked replies");
            return Promise.reject(new Error("TESTS: no more mocked replies"));
        });
        this.mock = this.call.mock;
        services.Conservify().protobuf = this.call;

        this.download = jest.fn(() => {
            console.log("TESTS: no more mocked downloads");
            return Promise.reject(new Error("TESTS: no more mocked downloads"));
        });
        this.downloadMock = this.download.mock;
        services.Conservify().download = this.download;
    }

    queueDownload(status, headers) {
        const response = {
            statusCode: status,
            headers: headers,
        };

        this.download.mockReturnValueOnce(Promise.resolve(response));

        return this;
    }

    queueBody(body) {
        const encoded = HttpReply.encodeDelimited(body).finish();
        const response = {
            body: Buffer.from(encoded),
        };

        return this.queueResponse(response);
    }

    queueAtlasBody(body) {
        const encoded = AtlasReply.encodeDelimited(body).finish();
        const response = {
            body: Buffer.from(encoded),
        };

        return this.queueResponse(response);
    }

    newFakeStation() {
        return {
            name: "Fake Station",
            generationId: randomHexString(),
            deviceId: randomHexString(),
            moduleIds: [randomHexString(), randomHexString(), randomHexString(), randomHexString()],
        };
    }

    newStreams(meta, data) {
        return [
            {
                time: 0,
                size: data * 689,
                block: data,
                name: "data.fkpb",
                path: "/fk/v1/download/data",
            },
            {
                time: 0,
                size: meta * 126,
                block: meta,
                name: "meta.fkpb",
                path: "/fk/v1/download/meta",
            },
        ];
    }

    newFakeStatusReply(station, gps, streams = null) {
        const defaultStreams = this.newStreams(1, 34);
        const statusStreams = streams || defaultStreams;
        return {
            errors: [],
            type: 15,
            status: {
                identity: {
                    device: station.name,
                    deviceId: Buffer.from(station.deviceId, "hex"),
                    generation: Buffer.from(station.generationId, "hex"),
                },
                power: {
                    battery: {},
                    solar: {},
                },
                memory: {
                    dataMemoryUsed: 0,
                },
                recording: {
                    startedTime: 0,
                },
                gps: gps || {},
            },
            streams: statusStreams,
            schedules: {
                readings: {},
            },
            modules: [
                {
                    name: "modules.water.ph",
                    path: "",
                    flags: 0,
                    header: {
                        manufacturer: 0,
                        kind: 0,
                        version: 0,
                    },
                    position: 0,
                    id: Buffer.from(station.moduleIds[0], "hex"),
                    sensors: [
                        { number: 0, name: "sensor_1", unitOfMeasure: "m" },
                        { number: 1, name: "sensor_2", unitOfMeasure: "m" },
                    ],
                },
            ],
            serialized: "AABBCCDDEEFFGGHH",
        };
    }

    newFakeReadingsReply(station) {
        this.now += 1;
        return {
            errors: [],
            type: 15,
            status: {
                identity: {
                    device: station.name,
                    deviceId: Buffer.from(station.deviceId, "hex"),
                    generation: Buffer.from(station.generationId, "hex"),
                },
                power: {
                    battery: {},
                    solar: {},
                },
                memory: {
                    dataMemoryUsed: 0,
                },
                recording: {
                    startedTime: 0,
                },
            },
            streams: [
                {
                    time: 0,
                    size: 100 * this.now,
                    block: 1 * this.now,
                    name: "data.fkpb",
                    path: "/fk/v1/download/data",
                },
                {
                    time: 0,
                    size: 64239 * this.now,
                    block: 34 * this.now,
                    name: "meta.fkpb",
                    path: "/fk/v1/download/meta",
                },
            ],
            schedules: {
                readings: {},
            },
            modules: [
                {
                    name: "modules.water.ph",
                    path: "",
                    flags: 0,
                    header: {
                        manufacturer: 0,
                        kind: 0,
                        version: 0,
                    },
                    position: 0,
                    id: Buffer.from(station.moduleIds[0], "hex"),
                    sensors: [
                        { number: 0, name: "sensor_1", unitOfMeasure: "m" },
                        { number: 1, name: "sensor_2", unitOfMeasure: "m" },
                    ],
                },
            ],
            liveReadings: [
                {
                    time: this.now,
                    modules: [
                        {
                            module: {
                                name: "modules.water.ph",
                                path: "",
                                flags: 0,
                                header: {
                                    manufacturer: 0,
                                    kind: 0,
                                    version: 0,
                                },
                                position: 0,
                                id: Buffer.from(station.moduleIds[0], "hex"),
                                sensors: [
                                    { number: 0, name: "sensor_1", unitOfMeasure: "m" },
                                    { number: 1, name: "sensor_2", unitOfMeasure: "m" },
                                ],
                            },
                            readings: [
                                {
                                    sensor: { number: 0, name: "sensor_1", unitOfMeasure: "m" },
                                    value: 100 * this.now,
                                },
                                {
                                    sensor: { number: 0, name: "sensor_2", unitOfMeasure: "m" },
                                    value: 200 * this.now,
                                },
                            ],
                        },
                    ],
                },
            ],
            serialized: "AABBCCDDEEFFGGHH",
        };
    }

    queueStatusReply(station) {
        return this.queueBody(this.newFakeStatusReply(station, null, null));
    }

    queueReadingsReply(station) {
        return this.queueBody(this.newFakeReadingsReply(station));
    }

    queueResponse(response) {
        this.call.mockReturnValueOnce(Promise.resolve(response));
        return this;
    }
}
