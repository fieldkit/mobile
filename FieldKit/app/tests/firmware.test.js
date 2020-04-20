import { Services } from "../services/services";
import StationUpgrade from "../services/station-firmware";
import FileSystem from "../wrappers/file-system";
import Fixtures from "./fixtures.js";

describe("Firmware", () => {
    let services;

    beforeEach(() => {
        services = new Services();

        return services
            .CreateDb()
            .initialize()
            .then(() => {
                return new Fixtures(services.Database()).addMinimum();
            });
    });

    it("should get and store new firmware from portal", () => {
        services.PortalInterface().listFirmware = jest.fn(_ => {
            return Promise.resolve({
                firmwares: [
                    {
                        id: 1000,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1000/download",
                    },
                    {
                        id: 1001,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1001/download",
                    },
                ],
            });
        });

        services.PortalInterface().downloadFirmware = jest.fn(_ => {
            return Promise.resolve({
                status: 200,
            });
        });

        return services.StationFirmware().downloadFirmware();
    });

    it("should delete firmware that disappears from the server", () => {
        services.PortalInterface().listFirmware = jest.fn(_ => {
            return Promise.resolve({
                firmwares: [
                    {
                        id: 1000,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1000/download",
                    },
                    {
                        id: 1001,
                        time: new Date(),
                        module: "module",
                        profile: "profile",
                        etag: "etag",
                        url: "/firmware/1001/download",
                    },
                ],
            });
        });

        services.PortalInterface().downloadFirmware = jest.fn(_ => {
            return Promise.resolve({
                status: 200,
            });
        });

        return services
            .Database()
            .addOrUpdateFirmware({
                id: 1101,
                time: new Date(),
                module: "module",
                profile: "profile",
                etag: "etag",
                url: "/firmware/1001/download",
                path: "/var/lib/firmware-1101",
            })
            .then(() => {
                return services.StationFirmware().downloadFirmware();
            })
            .then(() => {
                return services.Database().getAllFirmware();
            })
            .then(firmware => {
                expect(firmware.length).toEqual(2);
            });
    });
});
