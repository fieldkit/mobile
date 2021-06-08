import { debug } from "./debugging";

export function makeTaskId(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let id = "";
    for (let i = 0; i < length; i++) {
        id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return id;
}

export function getZone() {
    // eslint-disable-next-line
    return global["Zone"];
}

export async function zoned(options: { force?: boolean }, callback: () => Promise<void>): Promise<void> {
    const zone = getZone();
    if (!zone) {
        // debug.log("zone: warning no zone");
        await callback();
        return;
    }
    if (zone.current.get("taskId")) {
        if (!options.force) {
            await callback();
            return;
        }
    }
    await zone.current
        .fork({
            name: "task-ids",
            properties: {
                taskId: `task-${makeTaskId(6)}`,
            },
            onHandleError: function (parentZoneDelegate, currentZone, targetZone, error) {
                debug.log("error handled by zone: " + error);
            },
            /*
            onInvokeTask: function (
                parentZoneDelegate: ZoneDelegate,
                currentZone: Zone,
                targetZone: Zone,
                task: Task,
                applyThis: any,
                applyArgs?: any[]
            ): any {
                debug.log("zone: invoke-task", JSON.stringify(task), applyThis, JSON.stringify(applyArgs));
            },
            onFork: function (parentZoneDelegate: ZoneDelegate, zone: Zone, targetZone: Zone, zoneSpec: ZoneSpec): Zone {
                debug.log("zone: fork");
                return targetZone;
            },
            onInvoke: function (
                parentZoneDelegate: ZoneDelegate,
                currentZone: Zone,
                targetZone: Zone,
                delegate: Function,
                applyThis: any,
                applyArgs?: any[],
                source?: string
            ) {
                debug.log("zone: invoke", currentZone.name, delegate);
                return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
            },
            onScheduleTask: function (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task): Task {
                debug.log("zone: schedule", currentZone.name, task);
                return task;
            },
			*/
        })
        .run(async (): Promise<void> => {
            // debug.log("zoned:", getZone().current.name);
            await callback();
        });
}

export function getTaskId(): string {
    const zone = getZone();
    if (!zone) return "<nozone>";
    return zone.current.get("taskId") || `ROOT`;
}
