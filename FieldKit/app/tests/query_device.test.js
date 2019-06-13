import QueryDevice from 'services/query-device';

describe("query", () => {
    it("should", () => {
        const queryDevice = new QueryDevice();
        return queryDevice.queryStatus();
    });

    it("should", () => {
        const queryDevice = new QueryDevice();
        return queryDevice.queryCapabilities();
    });
});
