export class Timer {
    private id: ReturnType<typeof setInterval> | null;
    public counter = 0;

    constructor(interval: number, callback: (c: number) => void) {
        this.id = setInterval(() => {
            this.counter += 1;
            callback(this.counter);
        }, interval);
    }

    public stop(): void {
        if (this.id) {
            clearInterval(this.id);
            this.id = null;
        }
    }
}
