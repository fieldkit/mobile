export class EventHistory {
    constructor(services) {
        this.db = services.Database();
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
        return this.db.addEvent(event);
    }
}
