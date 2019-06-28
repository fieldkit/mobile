import axios from "axios";
import protobuf from "protobufjs";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const WireMessageQuery = appRoot.lookupType("fk_app.WireMessageQuery");
const WireMessageReply = appRoot.lookupType("fk_app.WireMessageReply");
const QueryType = appRoot.lookup("fk_app.QueryType");
const ReplyType = appRoot.lookup("fk_app.ReplyType");

export default class QueryStation {
    queryStatus(address) {
        const message = WireMessageQuery.create({
            type: QueryType.values.QUERY_STATUS
        });
        return this.stationQuery(address, message).then(
            r => {
                // console.log(address, "reply", r);
                return r;
            },
            e => {
                // console.log(address, "error", e);
                throw e;
            }
        );
    }

    queryIdentity(address) {
        const message = WireMessageQuery.create({
            type: QueryType.values.QUERY_IDENTITY
        });
        return this.stationQuery(address, message).then(
            r => {
                // console.log(address, "reply", r);
                return r;
            },
            e => {
                // console.log(address, "error", e);
                throw e;
            }
        );
    }

    queryCapabilities(address) {
        const message = WireMessageQuery.create({
            type: QueryType.values.QUERY_CAPABILITIES
        });
        return this.stationQuery(address, message).then(
            r => {
                // console.log(address, "reply", r);
                return r;
            },
            e => {
                // console.log(address, "error", e);
                throw e;
            }
        );
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    stationQuery(url, message) {
        const binaryQuery = WireMessageQuery.encodeDelimited(message).finish();
        const requestBody = new Buffer.from(binaryQuery).toString("hex");
        return axios({
            method: "POST",
            url: url,
            headers: {
                /* When we get rid of this hex encoding nonsense we'll fix this, too */
                // 'Content-Type': 'application/octet-stream',
                "Content-Type": "text/plain"
            },
            data: requestBody
        }).then(response => {
            if (response.data.length == 0) {
                console.log("Empty reply");
                return {};
            }
            const binaryReply = Buffer.from(response.data, "hex");
            return WireMessageReply.decodeDelimited(binaryReply);
        });
    }
}
