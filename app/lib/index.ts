export * from "./utilities";
export * from "./zoning";
export * from "./fs";
export * from "./timer";
export * from "./errors";
export * from "./testing";
export * from "./logging";
export * from "./analytics";
export * from "./debugging";

import { Utils } from "@nativescript/core";
import { ios } from "@nativescript/core/application";

export function hideKeyboard(): void {
    if (ios) {
        // eslint-disable-next-line
        ios.nativeApp.sendActionToFromForEvent("resignFirstResponder", null, null, null);
    } else {
        Utils.ad.dismissSoftInput();
    }
}

export function uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
