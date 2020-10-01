export declare class GeoUtils {
    /**
    * Is the current location within the given circle?
    *
    * @param {number} longitude to check
    * @param {number} latitude to check
    * @param {number} longitude center of circle
    * @param {number} latitude center of circle
    * @param {number} radius of circle in meters
    *
    * @return {boolean} true if the point is within the given geofence.
    *
    * @link https://stackoverflow.com/questions/24680247/check-if-a-latitude-and-longitude-is-within-a-circle-google-maps
    */
    static isLocationInCircle(lng: any, lat: any, circleLng: any, circleLat: any, circleRadius: any): boolean;
}
