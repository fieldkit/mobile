import { ContentView } from "@nativescript/core";
import { booleanConverter, Property } from "@nativescript/core";
// ------------------------------------------------------------
export var MapStyle;
(function (MapStyle) {
    MapStyle[(MapStyle["DARK"] = "dark")] = "DARK";
    MapStyle[(MapStyle["OUTDOORS"] = "outdoors")] = "OUTDOORS";
    MapStyle[(MapStyle["LIGHT"] = "light")] = "LIGHT";
    MapStyle[(MapStyle["SATELLITE"] = "satellite")] = "SATELLITE";
    MapStyle[(MapStyle["SATELLITE_STREETS"] = "satellite_streets")] = "SATELLITE_STREETS";
    MapStyle[(MapStyle["STREETS"] = "streets")] = "STREETS";
    MapStyle[(MapStyle["TRAFFIC_DAY"] = "traffic_day")] = "TRAFFIC_DAY";
    MapStyle[(MapStyle["TRAFFIC_NIGHT"] = "traffic_night")] = "TRAFFIC_NIGHT";
})(MapStyle || (MapStyle = {}));
// ------------------------------------------------------------
export class MapboxCommon {
    static merge(obj1, obj2) {
        let result = {}; // return result
        for (let i in obj1) {
            // for every property in obj1
            if (i in obj2 && typeof obj1[i] === "object" && i !== null) {
                result[i] = this.merge(obj1[i], obj2[i]); // if it's an object, merge
            } else {
                result[i] = obj1[i]; // add it to result
            }
        }
        for (let i in obj2) {
            // add the remaining properties from object 2
            if (i in result) {
                // conflict
                continue;
            }
            result[i] = obj2[i];
        }
        return result;
    }
    requestFineLocationPermission() {
        return new Promise((resolve) => {
            resolve();
        });
    }
    hasFineLocationPermission() {
        return new Promise((resolve) => {
            resolve(true);
        });
    }
}
MapboxCommon.defaults = {
    style: MapStyle.STREETS.toString(),
    mapStyle: MapStyle.STREETS.toString(),
    margins: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    zoomLevel: 0,
    showUserLocation: false,
    hideLogo: false,
    hideAttribution: true,
    hideCompass: false,
    disableRotation: false,
    disableScroll: false,
    disableZoom: false,
    disableTilt: false,
    delay: 0,
};
// ----------------------------------------------------------------------------------------
/**
 * common base for views created in XML.
 *
 * Instead of returning a reference to the Mapbox API instance (class Mapbox) from the view
 * the author decided to implement shim methods for a subset of the API. I'm not sure what the
 * reasoning was.
 *
 * @see Mapbox
 */
export class MapboxViewCommonBase extends ContentView {
    // -----------------------------------------------------------------
    /**
     * map event
     *
     * The base NativeScript ContentView class has on() and off() methods.
     */
    onMapEvent(eventName, id, callback) {
        console.log("MapboxViewCommonBase:on(): top");
        return this.mapbox.onMapEvent(eventName, id, callback, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    offMapEvent(eventName, id) {
        return this.mapbox.offMapEvent(eventName, id, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addMarkers(markers) {
        return this.mapbox.addMarkers(markers, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    removeMarkers(options) {
        return this.mapbox.removeMarkers(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnMapClickListener(listener) {
        return this.mapbox.setOnMapClickListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnMapLongClickListener(listener) {
        return this.mapbox.setOnMapLongClickListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnScrollListener(listener, nativeMap) {
        return this.mapbox.setOnScrollListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnMoveBeginListener(listener, nativeMap) {
        return this.mapbox.setOnMoveBeginListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnFlingListener(listener, nativeMap) {
        return this.mapbox.setOnFlingListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnCameraMoveListener(listener, nativeMap) {
        return this.mapbox.setOnCameraMoveListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnCameraMoveCancelListener(listener, nativeMap) {
        return this.mapbox.setOnCameraMoveCancelListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setOnCameraIdleListener(listener, nativeMap) {
        return this.mapbox.setOnCameraIdleListener(listener, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    getViewport() {
        return this.mapbox.getViewport(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setViewport(options) {
        return this.mapbox.setViewport(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setMapStyle(style) {
        return this.mapbox.setMapStyle(style, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    getCenter() {
        return this.mapbox.getCenter(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setCenter(options) {
        return this.mapbox.setCenter(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    getZoomLevel() {
        return this.mapbox.getZoomLevel(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setZoomLevel(options) {
        return this.mapbox.setZoomLevel(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    getTilt() {
        return this.mapbox.getTilt(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    setTilt(options) {
        return this.mapbox.setTilt(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    getUserLocation() {
        return this.mapbox.getUserLocation(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    showUserLocationMarker(options) {
        this.mapbox.showUserLocationMarker(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    hideUserLocationMarker() {
        this.mapbox.hideUserLocationMarker(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    changeUserLocationMarkerMode(renderModeString, cameraModeString) {
        this.mapbox.changeUserLocationMarkerMode(renderModeString, cameraModeString, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    forceUserLocationUpdate(location) {
        this.mapbox.forceUserLocationUpdate(location, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    trackUser(options) {
        return this.mapbox.trackUser(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addSource(id, options) {
        return this.mapbox.addSource(id, options, this.getNativeMapView());
    }
    removeSource(id) {
        return this.mapbox.removeSource(id, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addLayer(style) {
        return this.mapbox.addLayer(style, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    removeLayer(id) {
        return this.mapbox.removeLayer(id, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addLinePoint(id, point) {
        return this.mapbox.addLinePoint(id, point, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    queryRenderedFeatures(options) {
        return this.mapbox.queryRenderedFeatures(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addPolygon(options) {
        return this.mapbox.addPolygon(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    removePolygons(ids) {
        return this.mapbox.removePolygons(ids, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    addPolyline(options) {
        return this.mapbox.addPolyline(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    removePolylines(ids) {
        return this.mapbox.removePolylines(ids, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    animateCamera(options) {
        return this.mapbox.animateCamera(options, this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    destroy() {
        return this.mapbox.destroy(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onStart() {
        return this.mapbox.onStart(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onResume(nativeMap) {
        console.log("MapboxViewCommonBase:onResume(): with nativeView:", this.getNativeMapView());
        return this.mapbox.onResume(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onPause(nativeMap) {
        console.log("MapboxViewCommonBase:onPause(): with nativeView:", this.getNativeMapView());
        return this.mapbox.onPause(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onStop(nativeMap) {
        return this.mapbox.onStop(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onLowMemory(nativeMap) {
        return this.mapbox.onLowMemory(this.getNativeMapView());
    }
    // -----------------------------------------------------------------
    onDestroy(nativeMap) {
        return this.mapbox.onDestroy(this.getNativeMapView());
    }
}
// -----------------------------------------------------------------
/**
 * Properties definitions for the Mapbox XML tag.
 *
 * @link https://docs.nativescript.org/plugins/ui-plugin-custom
 */
export const mapReadyProperty = new Property({ name: "mapReady" });
mapReadyProperty.register(MapboxViewCommonBase);
export const zoomLevelProperty = new Property({ name: "zoomLevel" });
zoomLevelProperty.register(MapboxViewCommonBase);
export const accessTokenProperty = new Property({ name: "accessToken" });
accessTokenProperty.register(MapboxViewCommonBase);
export const mapStyleProperty = new Property({ name: "mapStyle" });
mapStyleProperty.register(MapboxViewCommonBase);
export const latitudeProperty = new Property({ name: "latitude" });
latitudeProperty.register(MapboxViewCommonBase);
export const longitudeProperty = new Property({ name: "longitude" });
longitudeProperty.register(MapboxViewCommonBase);
export const showUserLocationProperty = new Property({
    name: "showUserLocation",
    defaultValue: MapboxCommon.defaults.showUserLocation,
    valueConverter: booleanConverter,
});
showUserLocationProperty.register(MapboxViewCommonBase);
export const hideLogoProperty = new Property({
    name: "hideLogo",
    defaultValue: MapboxCommon.defaults.hideLogo,
    valueConverter: booleanConverter,
});
hideLogoProperty.register(MapboxViewCommonBase);
export const hideAttributionProperty = new Property({
    name: "hideAttribution",
    defaultValue: MapboxCommon.defaults.hideAttribution,
    valueConverter: booleanConverter,
});
hideAttributionProperty.register(MapboxViewCommonBase);
export const hideCompassProperty = new Property({
    name: "hideCompass",
    defaultValue: MapboxCommon.defaults.hideCompass,
    valueConverter: booleanConverter,
});
hideCompassProperty.register(MapboxViewCommonBase);
export const disableZoomProperty = new Property({
    name: "disableZoom",
    defaultValue: MapboxCommon.defaults.disableZoom,
    valueConverter: booleanConverter,
});
disableZoomProperty.register(MapboxViewCommonBase);
export const disableRotationProperty = new Property({
    name: "disableRotation",
    defaultValue: MapboxCommon.defaults.disableRotation,
    valueConverter: booleanConverter,
});
disableRotationProperty.register(MapboxViewCommonBase);
export const disableScrollProperty = new Property({
    name: "disableScroll",
    defaultValue: MapboxCommon.defaults.disableScroll,
    valueConverter: booleanConverter,
});
disableScrollProperty.register(MapboxViewCommonBase);
export const disableTiltProperty = new Property({
    name: "disableTilt",
    defaultValue: MapboxCommon.defaults.disableTilt,
    valueConverter: booleanConverter,
});
disableTiltProperty.register(MapboxViewCommonBase);
export const delayProperty = new Property({ name: "delay" });
delayProperty.register(MapboxViewCommonBase);
// -------------------------------------------------------------------------------------
/**
 * base class for views created in XML
 *
 * This is the glue that creates a config object based on the XML attributes passed to
 * the Mapbox XML tag.
 *
 * @see MapboxView
 *
 * @link https://docs.nativescript.org/plugins/ui-plugin-custom
 */
export class MapboxViewBase extends MapboxViewCommonBase {
    constructor() {
        // this took forever to find. The component-builder module apparently
        // looks for static members to find events on controls.
        super(...arguments);
        this.config = {};
    }
    [zoomLevelProperty.setNative](value) {
        this.config.zoomLevel = +value;
    }
    [mapStyleProperty.setNative](value) {
        console.log("MapboxViewBase::mapStyle.setNative(): setting value '" + value + "'");
        this.config.style = value;
        this.config.mapStyle = value;
    }
    [accessTokenProperty.setNative](value) {
        console.log("MapboxViewBase::accessTokenProperty.setNative(): setting value '" + value + "'");
        this.config.accessToken = value;
    }
    [delayProperty.setNative](value) {
        this.config.delay = parseInt("" + value);
    }
    [latitudeProperty.setNative](value) {
        this.config.center = this.config.center || {};
        this.config.center.lat = +value;
    }
    [longitudeProperty.setNative](value) {
        this.config.center = this.config.center || {};
        this.config.center.lng = +value;
    }
    [showUserLocationProperty.setNative](value) {
        this.config.showUserLocation = value;
    }
    [hideLogoProperty.setNative](value) {
        this.config.hideLogo = value;
    }
    [hideAttributionProperty.setNative](value) {
        this.config.hideAttribution = value;
    }
    [hideCompassProperty.setNative](value) {
        this.config.hideCompass = value;
    }
    [disableZoomProperty.setNative](value) {
        this.config.disableZoom = value;
    }
    [disableRotationProperty.setNative](value) {
        this.config.disableRotation = value;
    }
    [disableScrollProperty.setNative](value) {
        this.config.disableScroll = value;
    }
    [disableTiltProperty.setNative](value) {
        this.config.disableTilt = value;
    }
}
MapboxViewBase.mapReadyEvent = "mapReady";
MapboxViewBase.scrollEvent = "scrollEvent";
MapboxViewBase.moveBeginEvent = "moveBeginEvent";
MapboxViewBase.locationPermissionGrantedEvent = "locationPermissionGranted";
MapboxViewBase.locationPermissionDeniedEvent = "locationPermissionDenied";
// END
