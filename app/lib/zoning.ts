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

export async function zoned(callback: () => Promise<void>): Promise<void> {
    const zone = getZone();
    if (!zone) {
        console.log("zone: warning no zone");
        await callback();
        return;
    }
    if (zone.current.get("taskId")) {
        await callback();
        return;
    }
    await zone.current
        .fork({
            name: "task-ids",
            properties: {
                taskId: `task-${makeTaskId(6)}`,
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
                console.log("zone: invoke-task", JSON.stringify(task), applyThis, JSON.stringify(applyArgs));
            },
            onFork: function (parentZoneDelegate: ZoneDelegate, zone: Zone, targetZone: Zone, zoneSpec: ZoneSpec): Zone {
                console.log("zone: fork");
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
                console.log("zone: invoke", currentZone.name, delegate);
                return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
            },
            onScheduleTask: function (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task): Task {
                console.log("zone: schedule", currentZone.name, task);
                return task;
            },
			*/
        })
        .run(
            async (): Promise<void> => {
                // console.log("zoned:", getZone().current.name);
                await callback();
            }
        );
}

export function getTaskId(): string {
    const zone = getZone();
    if (!zone) return "<nozone>";
    return zone.current.get("taskId") || `ROOT`;
}
