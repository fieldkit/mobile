import axios from "axios";
import protobuf from "protobufjs";
import Services from "../services/services";

const queryStation = Services.QueryStation();

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpReply = appRoot.lookupType("fk_app.HttpReply");

jest.mock("axios");

afterEach(() => {
    axios.mockReset();
});

describe("QueryStation", () => {
    it("should retrieve a station status", () => {
        // const queryStation = new QueryStation();
        const binaryResponse = HttpReply.encodeDelimited({
            errors: [],
            type: 15,
            status: {},
            modules: [
                {
                    sensors: [[{}], [{}], [{}], [{}]],
                    name: "Water Quality Module"
                }
            ]
        }).finish();
        const mockResponse = {
            data: new Buffer.from(binaryResponse).toString("hex")
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryStation.getStatus().then(resp => expect(resp.modules).toBeDefined());
    });

    it("should retrieve station readings", () => {
        // const queryStation = new QueryStation();
        const binaryResponse = HttpReply.encodeDelimited({
            errors: [],
            type: 18,
            modules: [],
            streams: [],
            liveReadings: [{ modules: [{}], time: 1565734980 }]
        }).finish();
        const mockResponse = {
            data: new Buffer.from(binaryResponse).toString("hex")
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryStation.takeReadings().then(resp => expect(resp.liveReadings).toBeDefined());
    });
});
