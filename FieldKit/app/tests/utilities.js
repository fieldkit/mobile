import protobuf from 'protobufjs'
const appRoot = protobuf.Root.fromJSON(require('fk-app-protocol'))
const HttpReply = appRoot.lookupType('fk_app.HttpReply')

const atlasRoot = protobuf.Root.fromJSON(require("fk-atlas-protocol"));
const AtlasReply = atlasRoot.lookupType("fk_atlas.WireAtlasReply");

export class MockStationReplies {
    constructor(services) {
        this.services = services
        this.call = jest.fn(() => {
            return null
        })
        this.mock = this.call.mock;
        services.Conservify().protobuf = this.call
    }

    queueBody(body) {
        const encoded = HttpReply.encodeDelimited(body).finish()
        const response = {
            body: new Buffer.from(encoded),
        }

        return this.queueResponse(response);
    }

    queueAtlasBody(body) {
        const encoded = AtlasReply.encodeDelimited(body).finish()
        const response = {
            body: new Buffer.from(encoded),
        }

        return this.queueResponse(response);
    }

    queueResponse(response) {
        this.call.mockReturnValueOnce(Promise.resolve(response))

        return this;
    }
}
