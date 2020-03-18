import { Services } from "../services/services";
import StationUpgrade from "../services/station-firmware";
import FileSystem from "../wrappers/file-system";
import Fixtures from "./fixtures.js";

describe("Firmware", () => {
	let services;

	beforeEach(() => {
		services = new Services();

		return services.CreateDb().initialize().then(() => {
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
});
