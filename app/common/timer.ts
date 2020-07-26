export class Timer {
    private id: any | null;

    constructor(interval: number, callback: () => void) {
        this.id = setInterval(() => {
            callback();
        }, interval);
    }

    public stop() {
        if (this.id) {
            clearInterval(this.id);
            this.id = null;
        }
    }
}
