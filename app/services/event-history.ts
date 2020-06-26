export class EventHistory {
    db: any;

    constructor(db) {
        this.db = db;
    }

    onFoundStation(info) {
        return this._record({
            createdAt: new Date(),
            type: "FoundStation",
            body: info,
        });
    }

    onLostStation(info) {
        return this._record({
            createdAt: new Date(),
            type: "LostStation",
            body: info,
        });
    }

    onStationReply(reply) {
        return this._record({
            createdAt: new Date(),
            type: "StationReply",
            body: reply,
        });
    }

    _record(event) {
        console.log("recording", event.type);
        return Promise.resolve(event);
    }
}
