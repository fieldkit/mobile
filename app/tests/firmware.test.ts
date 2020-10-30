import _ from "lodash";
import FakeTimers from "@sinonjs/fake-timers";
import { describe, expect, it } from "@jest/globals";
import { Services, ServicesImpl } from "@/services";
import { MockStationReplies } from "./utilities";
import { prepareReply } from "@/store/http_reply";
import { StationRepliedAction } from "@/store/actions";

function addFakeFirmware(services: Services) {
    services.PortalInterface().listFirmware = jest.fn((_) => {
        const now = new Date();
        return Promise.resolve({
            firmwares: [
                {
                    id: 1000,
                    time: now.getTime(),
                    module: "module",
                    profile: "profile",
                    etag: "etag",
                    url: "/firmware/1000/download",
                    meta: "",
                    buildTime: 0,
                    buildNumber: "100",
                },
                {
                    id: 1001,
                    time: now.getTime(),
                    module: "module",
                    profile: "profile",
                    etag: "etag",
                    url: "/firmware/1001/download",
                    meta: "",
                    buildTime: 0,
                    buildNumber: "100",
                },
            ],
        });
    });

    services.PortalInterface().downloadFirmware = jest.fn((_) => {
        return Promise.resolve({
            status: 200,
        });
    });

    return services.StationFirmware().downloadFirmware();
}

describe("Firmware", () => {
    let services;
    let store;
    let clock;
    let mockStation;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
        clock.tick(10);

        services = new ServicesImpl();
        await services.CreateDb().initialize();
        mockStation = new MockStationReplies(services);

        store = services.Store();
    });

    afterEach(() => {});

    describe("state", () => {
        it("initialize", async () => {
            expect.assertions(1);

            const fake = [mockStation.newFakeStation(), mockStation.newFakeStation()];
            await store.dispatch(new StationRepliedAction(prepareReply(mockStation.newFakeStatusReply(fake[0])), "http://10.0.01/fk/v1"));
            await store.dispatch(new StationRepliedAction(prepareReply(mockStation.newFakeStatusReply(fake[1])), "http://10.0.01/fk/v1"));

            await addFakeFirmware(services);

            expect(Object.keys(store.state.firmware.stations).length).toBe(2);
        });
    });

    it("should get and store new firmware from portal", async () => {
        await addFakeFirmware(services);
    });

    it("should delete firmware that disappears from the server", async () => {
        services.PortalInterface().listFirmware = jest.fn((_) => {
            return Promise.resolve({
                firmwares: [
                    {
                        id: 1000,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1000/download",
                        meta: "",
                        buildTime: 0,
                        buildNumber: 100,
                    },
                    {
                        id: 1001,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1001/download",
                        meta: "",
                        buildTime: 0,
                        buildNumber: 100,
                    },
                ],
            });
        });

        services.PortalInterface().downloadFirmware = jest.fn((_) => {
            return Promise.resolve({
                status: 200,
            });
        });

        await services
            .Database()
            .addOrUpdateFirmware({
                id: 1101,
                time: new Date(),
                module: "module",
                profile: "profile",
                etag: "etag",
                url: "/firmware/1001/download",
                path: "/var/lib/firmware-1101",
                meta: "",
                buildTime: 0,
                buildNumber: 100,
            })
            .then(() => services.StationFirmware().downloadFirmware())
            .then(() => services.Database().getAllFirmware())
            .then((firmware) => {
                expect(firmware.length).toEqual(1);
            });
    });
});
