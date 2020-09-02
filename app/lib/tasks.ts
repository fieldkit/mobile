export interface WorkerMessage {
    data: { taskName: string };
}

export interface WorkerError {
    message: any;
    filename: any;
    lineno: any;
}

export abstract class Task {
    public abstract get taskName(): string;
    public abstract run(): Promise<any>;
}

export type TaskWorkerMap = { [index: string]: Function };

export class TaskWorker {
    constructor(public readonly ctx: Worker, public readonly map: TaskWorkerMap) {}

    public message(message: WorkerMessage) {
        const taskName = message.data.taskName;
        if (this.map[taskName]) {
            console.log(`worker:begin: ${taskName}`);
            const started = new Date();
            const ctor = this.map[taskName];
            const task = message.data as Task;
            Object.setPrototypeOf(task, ctor.prototype);
            try {
                Promise.resolve(task.run())
                    .catch((error) => {
                        console.log(`worker:error: ${taskName} ${error}`);
                    })
                    .finally(() => {
                        const end = new Date();
                        const elapsed = end.getTime() - started.getTime();
                        console.log(`worker:done: ${taskName} ${elapsed}`);
                    });
            } catch (error) {
                console.log(`worker:error: ${taskName} ${error}`);
            }
        } else {
            console.log(`worker:error: unknown type! ${JSON.stringify(message)}`);
        }
    }

    public error(error: WorkerError): boolean {
        console.log(`worker:error: ${error}`);
        return true;
    }
}

export class TaskQueue {
    private readonly workers: Worker[] = [];

    public start(workerFunc: any) {
        const worker = new workerFunc();
        worker.onmessage = (message) => {
            console.log(`main:received: ${JSON.stringify(message)}`);
        };
        this.workers.push(worker);
    }

    public enqueue<T extends Task>(task: T): void {
        this.workers[0].postMessage(task);
    }
}
