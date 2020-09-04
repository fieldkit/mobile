import _ from "lodash";
import { DataServices } from "./data-services";

export { DataServices };

export interface WorkerMessage {
    data: { taskName: string };
}

export interface WorkerError {
    message: any;
    filename: any;
    lineno: any;
}

export interface TaskQueuer {
    enqueue<T extends Task>(task: T): void;
}

export abstract class Task {
    public abstract get taskName(): string;
    public abstract run(services: DataServices, tasks: TaskQueuer): Promise<any>;
}

export type TaskWorkerMap = { [index: string]: Function };

export class TaskWorker {
    private readonly queuer: TaskQueuer;
    private readonly tasks: { [index: string]: Task } = {};

    constructor(private readonly ctx: Worker, private readonly services: DataServices, private readonly map: TaskWorkerMap) {
        this.queuer = new WorkerTaskQueuer(ctx);
        console.log("worker:ctor", Object.keys(this.map));
    }

    public message(message: WorkerMessage) {
        const taskName = message.data.taskName;
        if (!taskName) {
            console.log(`worker:ignored-message`);
            return;
        }
        if (this.map[taskName]) {
            console.log(`worker:begin: ${taskName}`);
            const started = new Date();
            const incomingTask = message.data as Task;
            if (!this.tasks[taskName]) {
                const ctor = this.map[taskName];
                Object.setPrototypeOf(incomingTask, ctor.prototype);
                this.tasks[taskName] = incomingTask;
            } else {
                this.tasks[taskName] = _.merge(this.tasks[taskName], incomingTask);
            }

            const task = this.tasks[taskName];

            try {
                Promise.resolve(task.run(this.services, this.queuer))
                    .catch((error) => {
                        console.log(`worker:error: ${taskName} ${error}`);
                    })
                    .finally(() => {
                        const end = new Date();
                        const elapsed = end.getTime() - started.getTime();
                        console.log(`worker:done: ${taskName} ${elapsed}`);
                        this.ctx.postMessage({ done: true });
                    });
            } catch (error) {
                console.log(`worker:error: ${taskName} ${error}`);
                this.ctx.postMessage({ done: true });
            }
        } else {
            console.log(`worker:error: unknown type! taskName=${taskName} message=${JSON.stringify(message)}`);
            console.log(`worker:error ${this.map[taskName]}`);
        }
    }

    public error(error: WorkerError): boolean {
        console.log(`worker:error: ${error}`);
        return true;
    }
}

export class TaskQueue implements TaskQueuer {
    private readonly workers: Worker[] = [];
    private index: number = 0;

    public start(size: number, workerFunc: any) {
        for (let i = 0; i < size; ++i) {
            const worker = new workerFunc();
            worker.onmessage = (message) => {
                if (message.data.done === true) {
                    console.log(`queue:done`);
                    return;
                }
                const taskName = message.data.taskName;
                if (!taskName) {
                    console.log(`queue:ignored`);
                    return;
                }
                console.log(`queue:message: ${taskName}`);
                this.deqeueuWorker().postMessage(message.data);
            };
            this.workers.push(worker);
        }
    }

    public get size(): number {
        return this.workers.length;
    }

    private deqeueuWorker(): Worker {
        return this.workers[this.index++ % this.workers.length];
    }

    public enqueue<T extends Task>(task: T): void {
        console.log("enqueue", this.workers.length, task);
        this.deqeueuWorker().postMessage(task);
    }
}

class WorkerTaskQueuer implements TaskQueuer {
    constructor(private readonly ctx: Worker) {}

    public enqueue<T extends Task>(task: T): void {
        this.ctx.postMessage(task);
    }
}
