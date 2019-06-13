import axios from 'axios';
import protobuf from "protobufjs";
const appRoot = protobuf.Root.fromJSON(require("fk-app-protocol"));
const WireMessageQuery = appRoot.lookupType("fk_app.WireMessageQuery");
const WireMessageReply = appRoot.lookupType("fk_app.WireMessageReply");
const QueryType = appRoot.lookup("fk_app.QueryType");
const ReplyType = appRoot.lookup("fk_app.ReplyType");

// 18 = QUERY_STATUS
// 10 = QUERY_FILES
const message = WireMessageQuery.create({type:18});
const encoded = WireMessageQuery.encodeDelimited(message).finish();
// encoded = 2,8,18

export default class QueryDevice {
    queryStatus() {
        axios({
            method: 'POST',
            url: "https://localhost:2382",
            contentType: 'application/octet-stream',
            // Note: Error: Response type of 'arraybuffer' not supported.
            // responseType: 'arraybuffer',
            data: encoded
        })
        .then(r => {
            console.log("response", r)
        })
        .catch(e => {
            console.log("error", e)
        })
    }
}

