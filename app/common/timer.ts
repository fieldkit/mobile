type Callback = (c: number) => void;

export class Timer {
    private id: ReturnType<typeof setInterval> | null;
    public counter = 0;

    constructor(interval: number, callback: Callback | null) {
        this.id = setInterval(() => {
            this.counter += 1;
            if (callback) {
                callback(this.counter);
            }
        }, interval);
    }

    public stop(): void {
        if (this.id) {
            clearInterval(this.id);
            this.id = null;
        }
    }
}
