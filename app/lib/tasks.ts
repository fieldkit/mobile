/*
import _ from "lodash";
import { DataServices } from "./data-services";

export interface WorkerMessage {
    data: {
        id: number;
        done: boolean;
        error: Error | unknown;
        task: {
            taskName: string;
        };
    };
}

export type WorkerError = ErrorEvent;

export interface TaskQueuer {
    enqueue<T extends Task>(task: T): void;
}

export abstract class Task {
    public abstract get taskName(): string;
    public abstract run(services: DataServices, tasks: TaskQueuer): Promise<void>;
}

export type TaskFunction = () => Promise<void>;

export type TaskWorkerMap = { [index: string]: TaskFunction };

export class TaskWorker {
    private readonly queuer: TaskQueuer;
    private readonly tasks: { [index: string]: Task } = {};

    constructor(private readonly ctx: Worker, private readonly services: DataServices, private readonly map: TaskWorkerMap) {
        this.queuer = new WorkerTaskQueuer(ctx);
        debug.log("worker:ctor", Object.keys(this.map));
    }

    public message(message: WorkerMessage): void {
        if (!message.data.task) {
            debug.log(`worker:malformed-message`);
            return;
        }
        const taskName = message.data.task.taskName;
        if (!taskName) {
            debug.log(`worker:ignored-message`);
            return;
        }
        if (this.map[taskName]) {
            debug.log(`worker:begin: ${taskName}`);
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
                    .catch((error: Error | undefined) => {
                        debug.log(`worker:error: ${taskName} ${JSON.stringify(error)}`);
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
                        debug.log(`worker:done: ${taskName} ${elapsed}`);
                    });
            } catch (error) {
                debug.log(`worker:error: ${taskName} ${JSON.stringify(error)}`);
                if (taskId) {
                    this.ctx.postMessage({ id: taskId, done: true });
                }
            }
        } else {
            debug.log(`worker:error: unknown type! taskName=${taskName} message=${JSON.stringify(message)}`);
        }
    }

    public error(error: WorkerError): boolean {
        debug.log(`worker:error: ${JSON.stringify(error)}`);
        return true;
    }
}

export type PendingPromises = [(value?: boolean) => void, (error: Error | unknown) => void];

export class TaskQueue implements TaskQueuer {
    private readonly workers: Worker[] = [];
    private readonly promises: { [index: number]: PendingPromises } = {};
    private index = 0;
    private counter = 0;

    public start(size: number, workerFunc: () => Worker): void {
        for (let i = 0; i < size; ++i) {
            const worker = workerFunc();
            worker.onmessage = (message: WorkerMessage) => {
                if (message.data.done) {
                    debug.log(`queue:done`, message.data.id);
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
                const taskName = message.data.task.taskName;
                if (!taskName) {
                    debug.log(`queue:ignored`);
                    return;
                }
                debug.log(`queue:message: ${taskName}`);
                this.enqueue(message.data.task as Task);
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
        debug.log("enqueue", 0, this.workers.length, task.taskName);
        this.deqeueuWorker().postMessage({ id: 0, task: task });
    }

    public sync<T extends Task>(task: T): Promise<void> {
        return new Promise((resolve: (boolean) => void, reject) => {
            this.counter += 1;
            this.promises[this.counter] = [resolve, reject];
            debug.log("sync", this.counter, this.workers.length, task.taskName);
            this.deqeueuWorker().postMessage({ id: this.counter, task: task });
        }).then(() => Promise.resolve());
    }
}

class WorkerTaskQueuer implements TaskQueuer {
    constructor(private readonly ctx: Worker) {}

    public enqueue<T extends Task>(task: T): void {
        this.ctx.postMessage(task);
    }
}
*/

export class TaskQueue {}
