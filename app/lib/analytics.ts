import { analytics } from "@nativescript/firebase/analytics";
import { debug } from "./debugging";

export async function logAnalytics(key: string, _info: Record<string, unknown> | undefined = undefined): Promise<void> {
    try {
        await analytics.logEvent({ key: key });
    } catch (error) {
        debug.log(`firebase:error: ${JSON.stringify(error)}`);
    }
}
