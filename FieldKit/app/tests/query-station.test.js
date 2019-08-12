import QueryStation from "../services/query-station";
import axios from "axios";
import protobuf from "protobufjs";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const HttpReply = appRoot.lookupType("fk_app.HttpReply");

jest.mock("axios");

afterEach(() => {
    axios.mockReset();
});

describe("QueryStation", () => {
    it("should retrieve a station status", () => {
        const queryStation = new QueryStation();
        const binaryResponse = HttpReply.encodeDelimited({
            errors: [],
            type: 15,
            status: {},
            modules: [{sensors: [[{}], [{}], [{}], [{}]], name: "Water Quality Module"}]
        }).finish();
        const mockResponse = {
            data: new Buffer.from(binaryResponse).toString("hex")
        };
        axios.mockImplementation(() => Promise.resolve(mockResponse));
        return queryStation
            .queryStatus()
            .then(resp => expect(resp.modules).toBeDefined());
    });

});
