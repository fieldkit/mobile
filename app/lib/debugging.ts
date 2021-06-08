import { Trace } from "@nativescript/core";

export interface LogEntry {
    messageType: string;
    message: string;
    date: string;
    taskId: string;
    category: string;
}

export type TaskIdProvider = () => string;

export function scrubMessage(message: string): string {
    return message.replace(/Bearer [^\s"']+/, "<TOKEN>");
}

export function getMessageType(type: undefined | number): string {
    const msgType = type === undefined ? Trace.messageType.log : type;
    switch (msgType) {
        case Trace.messageType.log:
            return "log";
        case Trace.messageType.info:
            return "info";
        case Trace.messageType.warn:
            return "warning";
        case Trace.messageType.error:
            return "error";
    }
    return "unknown";
}

export class DebugConsoleWriter {
    constructor(public readonly getTaskId: TaskIdProvider) {}

    public write(message: string, category: string, type: number | undefined): void {
        if (!console) {
            return;
        }

        const date = new Date().toISOString();
        const messageType = getMessageType(type);
        const taskId = this.getTaskId();

        console.log(`${date} ${messageType} ${taskId} ${category} ${message}`);
    }
}

export const debug = {
    log: function (...args: unknown[]): void {
        const parts: string[] = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg instanceof Error) {
                parts.push(arg.message);
                if (arg.stack) parts.push(arg.stack);
            } else if (typeof arg === "string") {
                parts.push(arg.trim());
            } else {
                try {
                    parts.push(JSON.stringify(arg));
                } catch (e) {
                    Trace.write(`[logging error] ${JSON.stringify(e)}`, Trace.categories.Debug);
                }
            }
        }

        if (Trace && Trace.write) {
            // eslint-disable-next-line
            Trace.write(parts.join(" "), Trace.categories.Debug);
        }
    },
};
