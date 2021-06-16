import { TrackingTransparency, TrackingStatus } from "@nstudio/nativescript-tracking-transparency";
import { isEnabled, getCurrentLocation, enableLocationRequest, Location } from "@nativescript/geolocation";
import { debug } from "@/lib";

export interface QueryLocationParams {
    desiredAccuracy: number;
    updateDistance: number;
    maximumAge: number;
    timeout: number;
}

export class GeoLocation {
    private async getTrackingTransparencyStatus(): Promise<TrackingStatus> {
        const status = TrackingTransparency.getTrackingStatus();
        debug.log(`tracking-transparency-status: ${status}`);
        if (status == TrackingStatus.NotDetermined) {
            return await TrackingTransparency.requestTrackingPermission();
        }
        return status;
    }

    private async canTrack(): Promise<boolean> {
        const status = await this.getTrackingTransparencyStatus();
        debug.log(`tracking-transparency-status: ${status}`);
        return status === TrackingStatus.Authorized || status === TrackingStatus.Unavailable;
    }

    public async isEnabled(enableTrackingTransparency = false): Promise<boolean> {
        if (!enableTrackingTransparency) {
            return isEnabled();
        }
        const canEnable = await this.canTrack();
        if (canEnable) {
            return isEnabled();
        }
        return false;
    }

    public getCurrentLocation(params: QueryLocationParams): Promise<Location> {
        return getCurrentLocation(params);
    }

    public enableLocationRequest(): Promise<void> {
        return enableLocationRequest();
    }
}
