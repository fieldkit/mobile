export class Timer {
    private id: any | null;
    public counter = 0;

    constructor(interval: number, callback: (c: number) => void) {
        this.id = setInterval(() => {
            this.counter += 1;
            callback(this.counter);
        }, interval);
    }

    public stop() {
        if (this.id) {
            clearInterval(this.id);
            this.id = null;
        }
    }
}
