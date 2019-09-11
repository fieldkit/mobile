import { Observable } from "tns-core-modules/data/observable";
import Config from '../config';

const log = Config.logger("Progress");

const HiddenProperty = "valueChanged";

class BetterObservable extends Observable {
    constructor() {
        super();
        this.value_ = null;
    }

    subscribe(receiver) {
        if (this.value_) {
            receiver(this.value_);
        }

        this.on(Observable.propertyChangeEvent, (data) => {
            switch (data.propertyName.toString()) {
            case HiddenProperty: {
                receiver(data.value);
                break;
            }
            }
        });
    }

    publish(value) {
        this.value_ = value;
        this.notifyPropertyChange(HiddenProperty, value);
    }
};

class ProgressTracker {
    constructor(service) {
        this.service = service;
        log("started");
    }

    update() {
        log("update");
    }

    cancel(error) {
        log("cancel", error);
        this.service._remove(this);
    }

    complete() {
        log("complete");
        this.service._remove(this);
    }
}

const Kinds = {
    DOWNLOAD: "DOWNLOAD",
    UPLOAD:    "UPLOAD",
};

export default class ProgressService extends BetterObservable {
    constructor() {
        super();
        this.active = [];
    }

    startOperation(kind) {
        const op = new ProgressTracker(this);
        this.active.push(op);
        return op;
    }

    startDownload() {
        return this.startOperation(Kinds.DOWNLOAD);
    }

    startUpload() {
        return this.startOperation(Kinds.UPLOAD);
    }

    _remove(operation) {
        const index = this.active.indexOf(operation);
        if (index >= 0) {
            this.active.splice(index, 1);
        }
        else {
            console.warn("Removing operation twice?");
        }
    }
}
