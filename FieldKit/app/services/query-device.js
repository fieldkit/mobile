import axios from 'axios';
import protobuf from "protobufjs";

const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const WireMessageQuery = appRoot.lookupType("fk_app.WireMessageQuery");
const WireMessageReply = appRoot.lookupType("fk_app.WireMessageReply");
const QueryType = appRoot.lookup("fk_app.QueryType");
const ReplyType = appRoot.lookup("fk_app.ReplyType");

export default class QueryDevice {
    queryStatus() {
        const message = WireMessageQuery.create({type:QueryType.values.QUERY_STATUS});
        return this.deviceQuery("https://localhost:2382", message).then(r => {
            console.log("reply", r)
        }, e=> {
            console.log("error", e)
        });
    }

    queryCapabilities() {
        const message = WireMessageQuery.create({type: QueryType.values.QUERY_CAPABILITIES});
        return this.deviceQuery("https://localhost:2382", message).then(r => {
            console.log("reply", r)
        }, e=> {
            console.log("error", e)
        });
    }

    /**
     * Perform a single device query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    deviceQuery(url, message) {
        const binaryQuery = WireMessageQuery.encodeDelimited(message).finish();
        const requestBody = new Buffer(binaryQuery).toString('hex');
        return axios({
            method: 'POST',
            url: url,
            headers: {
                /* When we get rid of this hex encoding nonsense we'll fix this, too */
                // 'Content-Type': 'application/octet-stream',
                'Content-Type': 'text/plain',
            },
            data: requestBody
        }).then(response => {
            const binaryReply = Buffer.from(response.data, 'hex');
            return WireMessageReply.decodeDelimited(binaryReply);
        });
    }
}
