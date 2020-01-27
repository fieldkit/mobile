import StationUpgrade from "../services/station-upgrade";
import Services from "../services/services";
import FileSystem from "../wrappers/file-system";

describe("Firmware", () => {
	beforeEach(() => {
        return Services.CreateDb().initialize();
	});

	it("should get and store new firmware from portal", () => {
		const fs = new FileSystem();

		Services.PortalInterface().listFirmware = jest.fn(_ => {
			return Promise.resolve({
				firmwares: [
					{
						id: 1000,
						time: new Date(),
						module: "module",
						profile: "profile",
						etag: "etag",
						url: "/firmware/1000/download"
					},
					{
						id: 1001,
						time: new Date(),
						module: "module",
						profile: "profile",
						etag: "etag",
						url: "/firmware/1001/download"
					}
				]
			});
		});

		Services.PortalInterface().downloadFirmware = jest.fn(_ => {
			return Promise.resolve({
				status: 200
			});
		});

		return new StationUpgrade(fs).downloadFirmware();
	});
});
