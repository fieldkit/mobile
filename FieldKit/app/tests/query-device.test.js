import QueryDevice from 'services/query-device';
import axios from "axios";
import protobuf from "protobufjs";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const WireMessageReply = appRoot.lookupType("fk_app.WireMessageReply");

jest.mock("axios");

afterEach(() => {
  axios.mockReset();
});

describe("QueryDevice", () => {
    it("should retrieve a device status", () => {
        const queryDevice = new QueryDevice();
        const binaryResponse = WireMessageReply.encodeDelimited({errors: [], type: 15, status: {}}).finish();
        const mockResponse = {data: new Buffer.from(binaryResponse).toString('hex')}
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryDevice.queryStatus().then(resp => expect(resp.status).toBeDefined());
    });

    it("should retrieve device capabilities", () => {
        const queryDevice = new QueryDevice();
        const binaryResponse = WireMessageReply.encodeDelimited({
                errors: [],
                type: 4,
                capabilities: {
                    modules: [],
                    sensors: [ [{}], [{}], [{}], [{}] ],
                    version: 1,
                    name: 'FieldKit Station'
                }
            }).finish();
        const mockResponse = {data: new Buffer.from(binaryResponse).toString('hex')}
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryDevice.queryCapabilities().then(resp => expect(resp.capabilities).toBeDefined());
    });
});

