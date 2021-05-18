import { analytics } from "@nativescript/firebase/analytics";

export async function logAnalytics(key: string, _info: Record<string, unknown> | undefined = undefined): Promise<void> {
    try {
        await analytics.logEvent({ key: key });
    } catch (error) {
        console.log(`firebase:error: ${JSON.stringify(error)}`);
    }
}
