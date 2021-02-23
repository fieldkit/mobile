export * from "./utilities";
export * from "./zoning";
export * from "./fs";
export * from "./timer";
export * from "./errors";
export * from "./testing";
export * from "./database";

import * as nsutils from "@nativescript/core/utils/utils";
import { ios } from "@nativescript/core/application";

export function hideKeyboard(): void {
    if (ios) {
        ios.nativeApp.sendActionToFromForEvent("resignFirstResponder", null, null, null);
    } else {
        nsutils.ad.dismissSoftInput();
    }
}
