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
    constructor(service, kind) {
        this.service = service;
        this.kind = kind;
        this.progress = {
            message: null,
            progress: 0.0,
        };
    }

    update(progress) {
        this.progress = progress;
        this.service._publish(this, progress);
        return Promise.resolve();
    }

    cancel(error) {
        log("cancel");
        this.service._remove(this);
        return Promise.reject(error);
    }

    complete() {
        log("complete");
        this.service._remove(this);
        return Promise.resolve();
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
        const op = new ProgressTracker(this, kind);
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
            this._publish();
        }
        else {
            console.warn("Removing operation twice?");
        }
    }

    _publish(operation) {
        this.publish(this._calculateProgress());
    }

    _calculateProgress() {
        if (this.active.length == 1) {
            return { ...{ }, ...this.active[0].progress, ...{ message: this._getMessage(this.active[0].kind) } };
        }
        else {
            log("active", this.active);
        }
        return {
            message: null,
            progress: 0.0,
        };
    }

    _getMessage(kind) {
        if (kind == Kinds.DOWNLOAD) {
            return "Downloading";
        }
        if (kind == Kinds.UPLOAD) {
            return "Uploading";
        }
        return "Working";
    }
}
