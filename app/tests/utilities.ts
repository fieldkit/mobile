import protobuf from "protobufjs";
import crypto from "crypto";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol")); // eslint-disable-line
const HttpReply = appRoot.lookupType("fk_app.HttpReply"); // eslint-disable-line
const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol")); // eslint-disable-line
const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply"); // eslint-disable-line

export function randomHexString(): string {
    return crypto.randomBytes(16).toString("hex");
}

type HttpHeaders = { [index: string]: string };

interface FakeStation {
    name: string;
    generationId: string;
    deviceId: string;
    moduleIds: string[];
    serviceInfo: {
        url: string;
        deviceId: string;
    };
}

interface FakeStreams {
    time: number;
    size: number;
    block: number;
    name: string;
    path: string;
}

export class MockStationReplies {
    services: any;
    now: number;
    call: any;
    mock: any;
    download: any;
    downloadMock: any;
    upload: any;
    uploadMock: any;
    json: any;
    jsonMock: any;

    constructor(services) {
        this.services = services;
        this.now = 0;

        console.log("MockStationReplies::ctor");

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

        this.upload = jest.fn(() => {
            console.log("TESTS: no more mocked uploads");
            return Promise.reject(new Error("TESTS: no more mocked uploads"));
        });
        this.uploadMock = this.upload.mock;
        services.PortalInterface().uploadPreviouslyDownloaded = this.upload;

        this.json = jest.fn(() => {
            console.log("TESTS: no more mocked json");
            return Promise.reject(new Error("TESTS: no more mocked json"));
        });
        this.jsonMock = this.json.mock;
        services.Conservify().json = this.json;
    }

    public queueUpload(status: number, headers: HttpHeaders): MockStationReplies {
        const response = {
            statusCode: status,
            headers: headers,
        };

        this.upload.mockReturnValueOnce(Promise.resolve(response));

        return this;
    }

    public queueCalculateDownloadSize(status: number, size: number): MockStationReplies {
        const response = {
            statusCode: status,
            headers: {
                "fk-bytes": size,
                "content-length": size,
            },
        };

        this.json.mockReturnValueOnce(Promise.resolve(response));

        return this;
    }

    public queueDownload(status: number, headers: HttpHeaders): MockStationReplies {
        const response = {
            statusCode: status,
            headers: headers,
        };

        this.download.mockReturnValueOnce(Promise.resolve(response));

        return this;
    }

    public queueBody(body: any): MockStationReplies {
        const encoded = HttpReply.encodeDelimited(body).finish();
        const response = {
            body: Buffer.from(encoded),
        };

        return this.queueResponse(response);
    }

    public queueAtlasBody(body: any): MockStationReplies {
        const encoded = AtlasReply.encodeDelimited(body).finish();
        const response = {
            body: Buffer.from(encoded),
        };

        return this.queueResponse(response);
    }

    public newFakeStation(): FakeStation {
        const deviceId = randomHexString();
        return {
            name: "Fake Station",
            deviceId: deviceId,
            generationId: randomHexString(),
            moduleIds: [randomHexString(), randomHexString(), randomHexString(), randomHexString()],
            serviceInfo: {
                url: "http://127.0.0.1:2380",
                deviceId: deviceId,
            },
        };
    }

    public newStreams(meta: number, data: number): FakeStreams[] {
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

    public newFakeStatusReply(station: FakeStation, gps: any = null, streams: FakeStreams[] | null = null): any {
        const defaultStreams = this.newStreams(1, 34);
        const statusStreams = streams || defaultStreams;
        /*
        const serialized = Buffer.from(
            HttpReply.encodeDelimited({
                status: {
                    firmware: {
                        timestamp: new Date().getTime(),
                        version: "version",
                        build: "build",
                        number: "120",
                        has: "hash",
                    },
                },
            }).finish()
        ).toString("base64");
*/

        return {
            errors: [],
            type: 15,
            status: {
                identity: {
                    name: station.name,
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
                    location: {
                        longitude: 0,
                        latitude: 0,
                        time: 0,
                    },
                },
                gps: gps || {},
                firmware: {
                    version: "version",
                    build: "build",
                    timestamp: 0,
                    number: "120",
                    has: "hash",
                },
                schedules: {
                    readings: {},
                    network: {},
                },
            },
            streams: statusStreams,
            schedules: {
                readings: {},
                network: {},
            },
            networkSettings: {
                connected: {
                    ssid: "SSID",
                },
                networks: [],
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
            liveReadings: [],
        };
    }

    public newFakeReadingsReply(station: FakeStation): any {
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
                firmware: {
                    version: "version",
                    build: "build",
                    timestamp: 0,
                    number: "120",
                    has: "hash",
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

    public queueStatusReply(station: FakeStation): MockStationReplies {
        return this.queueBody(this.newFakeStatusReply(station, null, null));
    }

    public queueReadingsReply(station: FakeStation): MockStationReplies {
        return this.queueBody(this.newFakeReadingsReply(station));
    }

    public queueNoReply(): MockStationReplies {
        this.call.mockReturnValueOnce(Promise.reject(new Error("fake connection error")));
        return this;
    }

    public queueResponse(response: any): MockStationReplies {
        this.call.mockReturnValueOnce(Promise.resolve(response));
        return this;
    }
}
