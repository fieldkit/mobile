import QueryStation from "../services/query-station";
import axios from "axios";
import protobuf from "protobufjs";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const WireMessageReply = appRoot.lookupType("fk_app.WireMessageReply");

jest.mock("axios");

afterEach(() => {
    axios.mockReset();
});

describe("QueryStation", () => {
    it("should retrieve a station status", () => {
        const queryStation = new QueryStation();
        const binaryResponse = WireMessageReply.encodeDelimited({
            errors: [],
            type: 15,
            status: {}
        }).finish();
        const mockResponse = {
            data: new Buffer.from(binaryResponse).toString("hex")
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryStation
            .queryStatus()
            .then(resp => expect(resp.status).toBeDefined());
    });

    it("should retrieve station capabilities", () => {
        const queryStation = new QueryStation();
        const binaryResponse = WireMessageReply.encodeDelimited({
            errors: [],
            type: 4,
            capabilities: {
                modules: [],
                sensors: [[{}], [{}], [{}], [{}]],
                version: 1,
                name: "FieldKit Station"
            }
        }).finish();
        const mockResponse = {
            data: new Buffer.from(binaryResponse).toString("hex")
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryStation
            .queryCapabilities()
            .then(resp => expect(resp.capabilities).toBeDefined());
    });
});
