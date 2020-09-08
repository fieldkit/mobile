import _ from "lodash";
import { DataServices } from "./data-services";

export { DataServices };

export interface WorkerMessage {
    data: { id: number; task: { taskName: string } };
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
        if (!message.data.task) {
            console.log(`worker:malformed-message`);
            return;
        }
        const taskName = message.data.task.taskName;
        if (!taskName) {
            console.log(`worker:ignored-message`);
            return;
        }
        if (this.map[taskName]) {
            console.log(`worker:begin: ${taskName}`);
            const started = new Date();
            const taskId = message.data.id;
            const incomingTask = message.data.task as Task;
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
                        if (taskId) {
                            this.ctx.postMessage({ id: taskId, error: error });
                        }
                    })
                    .then((value) => {
                        if (taskId) {
                            this.ctx.postMessage({ id: taskId, done: value });
                        }
                    })
                    .finally(() => {
                        const end = new Date();
                        const elapsed = end.getTime() - started.getTime();
                        console.log(`worker:done: ${taskName} ${elapsed}`);
                    });
            } catch (error) {
                console.log(`worker:error: ${taskName} ${error}`);
                if (taskId) {
                    this.ctx.postMessage({ id: taskId, done: true });
                }
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
    private readonly promises: { [index: number]: any } = {};
    private index: number = 0;
    private counter: number = 0;

    public start(size: number, workerFunc: any) {
        for (let i = 0; i < size; ++i) {
            const worker = new workerFunc();
            worker.onmessage = (message) => {
                if (message.data.done) {
                    console.log(`queue:done`, message.data.id);
                    if (this.promises[message.data.id]) {
                        const [resolve, reject] = this.promises[message.data.id];
                        if (message.data.error) {
                            reject(message.data.error);
                        } else {
                            resolve(message.data.done);
                        }
                    }
                    return;
                }
                const taskName = message.data.taskName;
                if (!taskName) {
                    console.log(`queue:ignored`);
                    return;
                }
                console.log(`queue:message: ${taskName}`);
                this.enqueue(message.data);
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
        console.log("enqueue", 0, this.workers.length, task.taskName);
        this.deqeueuWorker().postMessage({ id: 0, task: task });
    }

    public sync<T extends Task>(task: T): Promise<any> {
        return new Promise((resolve, reject) => {
            this.counter += 1;
            this.promises[this.counter] = [resolve, reject];
            console.log("sync", this.counter, this.workers.length, task.taskName);
            this.deqeueuWorker().postMessage({ id: this.counter, task: task });
        });
    }
}

class WorkerTaskQueuer implements TaskQueuer {
    constructor(private readonly ctx: Worker) {}

    public enqueue<T extends Task>(task: T): void {
        this.ctx.postMessage(task);
    }
}
