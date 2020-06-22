import { BusyError } from "../lib/errors";

export class Mutex {
    constructor() {
        this._task = null;
    }

    tryStart(promiseFactory) {
        if (this._task) {
            return Promise.reject(new BusyError());
        }

        this._task = new Date();

        return Promise.resolve().then(_ => {
            return promiseFactory().then(
                success => {
                    this._task = null;
                    return success;
                },
                error => {
                    this._task = null;
                    return Promise.reject(error);
                }
            );
        });
    }
}
