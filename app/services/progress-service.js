import _ from "lodash";
import { BetterObservable } from "./rx";
import Config from "../config";

const log = Config.logger("Progress");

class ProgressTracker {
    constructor(service, kind, info) {
        this.service = service;
        this.kind = kind;
        this.finished = false;
        this.progress = _.merge(info || {}, this.progress, { message: null, finished: true, success: false, cancel: false, progress: 0.0 });
    }

    update(progress) {
        if (this.finished) {
            return;
        }
        this.progress = progress;
        this.service._publish(this, this.progress);
        return Promise.resolve();
    }

    /**
     * I'm trying to keep the mutation of the internal progress object
     * in this single place.
     */
    updateStation(updatedTask) {
        if (this.finished) {
            return;
        }

        const device = this.progress[updatedTask.deviceId];
        const tasks = device.tasks;
        const task = (tasks[updatedTask.key] = _.merge(tasks[updatedTask.key], updatedTask));

        task.progress = (task.currentSize / task.totalSize) * 100.0;

        log.info("updating", task);

        const deviceTotal = _(tasks)
            .map(t => t.totalSize || 0)
            .sum();
        const deviceCurrent = _(tasks)
            .map(t => t.currentSize || 0)
            .sum();

        device.totalSize = deviceTotal;
        device.currentSize = deviceCurrent;
        device.progress = (deviceCurrent / deviceTotal) * 100.0;

        log.info("device", device);

        this.service._publish(this, this.progress);
        return Promise.resolve();
    }

    cancel(error) {
        if (this.finished) {
            return;
        }
        log.info("cancel");
        this.finished = true;
        this.progress = _.merge(this.progress, {
            finished: true,
            success: false,
            cancel: true,
        });
        this.service.publish(this.progress);
        this.service._remove(this);
        return Promise.reject(error);
    }

    complete() {
        if (this.finished) {
            return;
        }
        log.info("complete");
        this.finished = true;
        this.progress = _.merge(this.progress, {
            finished: true,
            success: true,
            cancel: false,
        });
        this.service.publish(this.progress);
        this.service._remove(this);
        return Promise.resolve();
    }
}

const Kinds = {
    DOWNLOAD: "DOWNLOAD",
    UPLOAD: "UPLOAD",
    UPGRADE: "UPGRADE",
};

export default class ProgressService extends BetterObservable {
    constructor() {
        super();
        this.active = [];
    }

    startOperation(kind, info) {
        const op = new ProgressTracker(this, kind, info);
        this.active.push(op);
        log.info("started", kind, info);
        return op;
    }

    startDownload(info) {
        return this.startOperation(Kinds.DOWNLOAD, info);
    }

    startUpload(info) {
        return this.startOperation(Kinds.UPLOAD, info);
    }

    startUpgrade(info) {
        return this.startOperation(Kinds.UPGRADE, info);
    }

    _remove(operation) {
        const index = this.active.indexOf(operation);
        if (index >= 0) {
            this.active.splice(index, 1);
            this._publish();
        } else {
            console.warn("Removing operation twice?");
        }
    }

    _publish(operation) {
        this.publish(this._calculateProgress());
    }

    _calculateProgress() {
        if (this.active.length == 1) {
            return {
                ...{},
                ...this.active[0].progress,
                ...{ message: this._getMessage(this.active[0].kind) },
            };
        } else {
            log.info("active", this.active);
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
