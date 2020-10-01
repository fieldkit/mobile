/// <reference path="platforms/ios/Mapbox.d.ts" />
import { AddExtrusionOptions, AddGeoJsonClusteredOptions, AddPolygonOptions, AddPolylineOptions, AddSourceOptions, AnimateCameraOptions, DeleteOfflineRegionOptions, DownloadOfflineRegionOptions, Feature, LatLng, ListOfflineRegionsOptions, MapboxApi, MapboxCommon, MapboxMarker, MapboxViewBase, MapStyle, OfflineRegion, QueryRenderedFeaturesOptions, SetCenterOptions, SetTiltOptions, SetViewportOptions, SetZoomLevelOptions, ShowOptions, TrackUserOptions, UserLocation, UserLocationCameraMode, Viewport } from "./mapbox.common";
export { MapStyle };
export declare namespace BundleKludge {
    let bundle: {
        test: string;
    };
}
/**
* A map view created in XML.
*
* This is the class that is created when the Mapbox XML tag
* is encountered while parsing a view.
*
* Angular components need to register the Mapbox tag as follows:
*
* import { registerElement } from "nativescript-angular/element-registry";
* registerElement( "Mapbox", () => require("nativescript-mapbox").MapboxView);
*
* The registerElement call is what binds the XML tag to the class that creates it.
*
* @see MapboxViewBase
*/
export declare class MapboxView extends MapboxViewBase {
    private nativeMapView;
    private settings;
    private gcFixIndex;
    private initialized;
    constructor();
    /**
    * programmatically include settings
    *
    * @todo
    */
    setConfig(settings: any): void;
    /**
    * create a new entry in the global gc fix map.
    *
    * We may have multiple maps on a page.
    */
    gcFixInit(): void;
    /**
    * add a reference to a global stack to prevent premature garbage collection
    *
    * As a performance improvement, the memory management "markingMode": "none"
    * can be enabled with the potential downside that the javascript and java
    * garbage collection systems get out of sync. This typically happens when a
    * javascript reference goes out of scope and the corresponding java object
    * is collected before it should be.
    *
    * To work around this, whenever we create some java object that's potentially
    * used in a closure, we keep a global reference to it to prevent it from
    * being garbage collected.
    *
    * This, of course, has the potential for causing memory leaks if we do not
    * correctly manage the stack.
    *
    * @param {string} key the key under which to store the reference. eg. android.widget.FrameLayout
    * @param {any} ref the object reference to store.
    */
    gcFix(key: string, ref: any): void;
    /**
    * clear the gc preventation stack
    */
    gcClear(): void;
    getNativeMapView(): any;
    /**
    * Return the Mapbox() API Shim instance
    *
    * This returns a reference to the Mapbox API shim class instance.
    * See class Mapbox below.
    *
    * @see Mapbox
    */
    getMapboxApi(): any;
    /**
    * Creates the native view.
    *
    * This method is supposed to create the native view. NativeScript caches
    * and re-uses views to save on memory and increase performance. Unfortunately,
    * the inner details of exactly how this is done is challenging to tease apart.
    *
    * The problem is that in order to create the Mapbox view we need the access token from
    * the XML, but in the case of a pure NativeScript app with property binding
    * (see the demo), the properties don't seem to be available until the page is loaded.
    *
    * As a workaround, I wait until the page is loaded to configure the map. See initNativeView.
    *
    * It seems to me there should be a better way.
    *
    * @link https://docs.nativescript.org/core-concepts/properties#views-lifecycle-and-recycling
    *
    * @todo check this.
    */
    createNativeView(): Object;
    /**
    * initializes the native view.
    *
    * In NativeScript, views are cached so they can be reused. This method is
    * supposed to setup listeners and handlers in the NativeView.
    *
    * What I don't understand here is when XML property (attribute) binding
    * is supposed to happen. In order to create the map we need the access token.
    * In the NativeScript demo, the access token is passed in via a property that
    * is bound on page load.
    *
    * Unfortunately, initNativeView seems to get called before page load. So here,
    * as a workaround the feels ugly, I wait to create the map until the page is loaded.
    *
    * The problem with this, however, is that as the user navigates through the
    * app page loaded and unloaded events will get fired, so to avoid clobbering
    * ourselves, we need to keep track of whether or not we've been initialized.
    *
    * It seems to me that there should be a way to get at the  data binding at this point.
    */
    initNativeView(): void;
    /**
    * when the view is destroyed.
    *
    * This is called by the framework when the view is actually destroyed.
    * NativeScript, by design, tries to cache native views because
    * creating native views is expensive.
    *
    * @link https://docs.nativescript.org/plugins/ui-plugin-custom
    */
    disposeNativeView(): Promise<void>;
    /**
    * initialize the map
    *
    * This method creates a new mapbox API instance and, through the show() method of the Mapbox API,
    * creates a Mapbox native map view.
    *
    * @see show()
    *
    * @link https://docs.nativescript.org/core-concepts/events
    *
    * @todo FIXME: this.nativeMapView is unused and never actually set to anything.
    */
    private initMap;
}
/**
* A NativeScript shim for the Mapbox API.
*
* This implements a Typescript shim over the Native Mapbox GL Android API.
*
* It is created in one of two ways:
*
* - directly via let mapbox = new Mapbox(); mapbox.show( ... )
* - via the Mapbox XML tag in which case a MapboxView object is created which hosts a reference to this class. (See MapboxView::getMapboxAPI())
*/
export declare class Mapbox extends MapboxCommon implements MapboxApi {
    private _mapboxMapInstance;
    private _mapboxViewInstance;
    private _activity;
    private _locationComponent;
    /**
    * the permissionsManager
    *
    * @link https://docs.mapbox.com/android/core/overview/#permissionsmanager
    */
    private _permissionsManager;
    private _accessToken;
    private circleManager;
    private lineManager;
    private symbolManager;
    private _offlineManager;
    private onDidFailLoadingMapListener;
    private onDidFinishLoadingMapListener;
    private onMapReadyCallback;
    private onDidFinishLoadingStyleListener;
    private onAnnotationClickListener;
    private onMapClickListener;
    private onMapLongClickListener;
    private onMoveListener;
    private onScrollListener;
    private onFlingListener;
    private onCameraMoveListener;
    private onCameraMoveCancelListener;
    private onCameraIdleListener;
    private onLocationClickListener;
    private _markers;
    private _polylines;
    private _polygons;
    private circles;
    private lines;
    private eventCallbacks;
    _markerIconDownloadCache: any[];
    constructor();
    /**
    * add a reference to a global stack to prevent premature garbage collection
    *
    * @param {string} key the key under which to store the reference. eg. android.widget.FrameLayout
    * @param {any} ref the object reference to store.
    *
    * @see MapboxView::gcFix()
    */
    gcFix(key: string, ref: any): void;
    /**
    * clear the gc preventation stack
    */
    gcClear(): void;
    /**
    * not used
    */
    setMapboxViewInstance(mapboxViewInstance: any): void;
    /**
    * not used
    */
    setMapboxMapInstance(mapboxMapInstance: any): void;
    /**
    * show the map programmatically.
    *
    * This method is used to programmatically display a map. It is also called
    * by the MapboxView::init() method which initializes the map when the Mapbox
    * XML tags is encountered
    *
    * options may additionally include:
    *
    * - context
    * - parentView
    * - onLocationPermissionGranted
    * - onLocationPermissionDenied
    * - onMapReady
    *
    * @see MapboxView::init()
    *
    * @todo FIXME: the timeout delay before showing the map works around some race condition. The source error needs to be figured out.
    */
    show(options: ShowOptions): Promise<any>;
    /**
    * hide the map
    */
    hide(): Promise<any>;
    unhide(): Promise<any>;
    /**
    * destroy the map programmatically
    *
    * Destroy the map instance.
    */
    destroy(nativeMap?: any): Promise<any>;
    /**
    * Clear Event Listeners
    *
    * Explicitly clear all registered event listeners. It's not clear to me whether or not this
    * is strictly necessary as I imagine these should all get cleaned up when the map is destroyed
    * but given the complication of NativeScript's garbage collection scheme it seems like a good
    * idea to remove these handlers explicitly.
    */
    private clearEventListeners;
    /**
    * on Start
    */
    onStart(nativeMap?: any): Promise<any>;
    /**
    * on Resume
    */
    onResume(nativeMapViewInstance?: any): Promise<any>;
    /**
    * on Pause
    */
    onPause(nativeMapViewInstance?: any): Promise<any>;
    /**
    * on Stop
    */
    onStop(nativeMap?: any): Promise<any>;
    /**
    * on Low Memory
    */
    onLowMemory(nativeMap?: any): Promise<any>;
    /**
    * on Destroy
    */
    onDestroy(nativeMap?: any): Promise<any>;
    /**
    * event handler shim
    *
    * Initialize our event handler shim so that we can intercept events here.
    *
    * @param { any } settings
    * @param { MapboxView } mapboxView
    */
    initEventHandlerShim(settings: any, mapboxNativeViewInstance: any): void;
    /**
    * register on click handlers.
    *
    * The native mapbox API does not, apparently, support click handlers
    * on circles, but it does for markers and polylines. WTF?
    *
    * Here we attempt to replicate the mapbox-gl-js behaviour of being
    * able to assign an onClick handler to a layer by it's layer id.
    *
    * @param {string} event - the event to subscribe to. i.e. 'click'.
    * @param {string} id - the id of the layer
    * @param {function} callback - the callback to invoke when the layer is clicked on.
    * @param {object] nativeMapView - reference to the native Map view.
    *
    * @link https://github.com/mapbox/mapbox-android-demo/issues/540
    */
    onMapEvent(eventName: any, id: any, callback: any, nativeMapView?: any): void;
    /**
    * remove an event handler for a layer
    *
    * This will remove all event handlers (that we manage here) for
    * the given layer id and event.
    */
    offMapEvent(eventName: any, id: any, nativeMapView?: any): void;
    /**
    * handles a line click event
    *
    * Given a click on a line overlay, find the id of the underlying line layer
    * an invoke any registered callbacks.
    */
    private handleLineClickEvent;
    /**
    * checks for a click event on a circle.
    *
    * For the moment we have to handle map click events long hand ourselves for circles.
    *
    * When we catch an event we'll check the eventHandlers map to see if the
    * given layer is listed. If it is we invoke it's callback.
    *
    * If there are multiple overlapping circles only the first one in the list will be called.
    *
    * We also check the location of the click to see if it's inside any
    * circles and raise the event accordingly.
    *
    * @todo detect the top circle in the overlapping circles case.
    */
    private checkForCircleClickEvent;
    /**
    * add Clickable Line Overlay
    *
    * As of this writing, Mapbox Layer lines do not support click handlers however
    * they do offer a nice array of styling options.
    *
    * Annotation plugin lines do support click handlers but have limited styling
    * options.
    *
    * To wedge click handler support onto Mapbox layer lines we overlay the line
    * with an invisible Annotation line and catch click events from that.
    *
    * @param {string} lineId id of lineLayer we are to draw the clickable annotation over..
    * @param {object} nativeMapView
    *
    * @return {Promise<any>} clickLine layer
    *
    * @link https://stackoverflow.com/questions/54795079/how-to-get-a-geometry-from-a-mapbox-gl-native-geojsonsource
    *
    * @todo we assume a geojson source for lines.
    * @todo ideally I'd like to pull the geometry out of the line instead of keeping a separate copy of the coordinates around.
    */
    private addClickableLineOverlay;
    hasFineLocationPermission(): Promise<boolean>;
    /**
    * Request fine locaion permission
    *
    * @link https://docs.mapbox.com/android/core/overview/#permissionsmanager
    */
    requestFineLocationPermission(): Promise<any>;
    onRequestPermissionsResults(requestCode: any, permissions: any, grantResults: any): void;
    /**
    * set the map style
    *
    * The 7.X version of the SDK uses a builder class for forming
    * URLs.
    *
    * NOTE: The style must be explicitly set using this method in the onMapReady() handler.
    *
    * @param {string | MapStyle } style - a style following the Mapbox style specification or a URL to a style.
    * @param {any} nativeMapViewInstance - native map view (com.mapbox.mapboxsdk.maps.MapView)
    *
    * @see MapboxViewCommonBase:setMapStyle()
    *
    * @link https://docs.mapbox.com/android/api/map-sdk/7.1.2/com/mapbox/mapboxsdk/maps/Style.Builder.html
    * @link https://docs.mapbox.com/android/api/map-sdk/7.1.2/com/mapbox/mapboxsdk/maps/MapboxMap.html#setStyle-java.lang.String-com.mapbox.mapboxsdk.maps.Style.OnStyleLoaded-
    */
    setMapStyle(style: string | MapStyle, nativeMapViewInstance?: any): Promise<any>;
    addMarkers(markers: MapboxMarker[], nativeMap?: any): Promise<any>;
    removeMarkers(ids?: any, nativeMap?: any): Promise<any>;
    /**
    *
    * @deprecated
    * @link https://github.com/mapbox/mapbox-plugins-android/tree/master/plugin-annotation
    */
    _addMarkers(markers: MapboxMarker[], nativeMap?: any): void;
    /**
    *
    * @deprecated
    */
    _removeMarkers(ids?: any, nativeMap?: any): void;
    setCenter(options: SetCenterOptions, nativeMap?: any): Promise<any>;
    getCenter(nativeMap?: any): Promise<LatLng>;
    setZoomLevel(options: SetZoomLevelOptions, nativeMap?: any): Promise<any>;
    getZoomLevel(nativeMap?: any): Promise<number>;
    setTilt(options: SetTiltOptions, nativeMap?: any): Promise<any>;
    getTilt(nativeMap?: any): Promise<number>;
    /**
    * get users current location
    *
    * @link https://docs.mapbox.com/android/api/map-sdk/9.0.0/com/mapbox/mapboxsdk/location/LocationComponent.html#getLastKnownLocation--
    */
    getUserLocation(): Promise<UserLocation>;
    /**
    *
    * @link https://www.mapbox.com/android-docs/api/mapbox-java/libjava-geojson/3.4.1/com/mapbox/geojson/Feature.html
    */
    queryRenderedFeatures(options: QueryRenderedFeaturesOptions, nativeMap?: any): Promise<Array<Feature>>;
    /**
    *
    * @deprecated
    */
    addPolygon(options: AddPolygonOptions, nativeMap?: any): Promise<any>;
    /**
    *
    * @deprecated
    */
    addPolyline(options: AddPolylineOptions, nativeMap?: any): Promise<any>;
    removePolygons(ids?: Array<any>, nativeMap?: any): Promise<any>;
    removePolylines(ids?: Array<any>, nativeMap?: any): Promise<any>;
    animateCamera(options: AnimateCameraOptions, nativeMap?: any): Promise<any>;
    /**
    * set an on map click listener.
    *
    * The new Mapbox Native SDK allows for multiple listeners on an event and follows the standard
    * pattern of returning 'true' when a handler has handled the event and others shouldn't.
    *
    * Not returning a boolean from the listener function will cause a crash.
    */
    setOnMapClickListener(listener: (data: LatLng) => void, nativeMap?: MapboxView): Promise<any>;
    setOnMapLongClickListener(listener: (data: LatLng) => void, nativeMap?: any): Promise<any>;
    setOnMoveBeginListener(listener: (data?: LatLng) => void, nativeMap?: any): Promise<void>;
    setOnScrollListener(listener: (data?: LatLng) => void, nativeMap?: any): Promise<void>;
    setOnFlingListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraMoveListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraMoveCancelListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraIdleListener(listener: () => void, nativeMap?: any): Promise<any>;
    getViewport(nativeMap?: any): Promise<Viewport>;
    setViewport(options: SetViewportOptions, nativeMap?: any): Promise<any>;
    downloadOfflineRegion(options: DownloadOfflineRegionOptions): Promise<any>;
    listOfflineRegions(options?: ListOfflineRegionsOptions): Promise<OfflineRegion[]>;
    deleteOfflineRegion(options: DeleteOfflineRegionOptions): Promise<any>;
    _getOfflineManager(): any;
    addExtrusion(options: AddExtrusionOptions, nativeMap?: any): Promise<any>;
    /**
    * add a geojson or vector source
    *
    * Add a source that can then be referenced in the style specification
    * passed to addLayer().
    *
    * @link https://docs.mapbox.com/mapbox-gl-js/api/#map#addsource
    */
    addSource(id: string, options: AddSourceOptions, nativeMap?: any): Promise<any>;
    /**
    * remove source by id
    */
    removeSource(id: string, nativeMap?: any): Promise<any>;
    /**
    * a rough analogue to the mapbox-gl-js addLayer() method
    *
    * It would be nice if this {N} API matched the mapbox-gl-js API which
    * would make it much easier to share mapping applications between the web
    * and {N} apps.
    *
    * This method accepts a Mapbox-GL-JS style specification JSON object with some
    * limitations:
    *
    * - the source: must be a GeoJSON object, vector source definition, or an id of a source added via addSource()
    * - only a subset of paint properties are available.
    *
    * @param {object} style - a style following the Mapbox style specification.
    * @param {any} nativeMapView - native map view (com.mapbox.mapboxsdk.maps.MapView)
    *
    * @link https://docs.mapbox.com/mapbox-gl-js/style-spec/#layers
    */
    addLayer(style: any, nativeMapView?: any): Promise<any>;
    /**
    * remove layer by ID
    *
    * Removes a layer given a layer id
    *
    * @param {string} id
    */
    removeLayer(id: string, nativeMapViewInstance: any): Promise<unknown>;
    /**
    * add a line layer
    *
    * Draws a line layer based on a mapbox-gl-js Mapbox Style.
    *
    * What sucks about this is that there is apparently no facility to add an event listener to a layer.
    *
    * The idea for this method is to make sharing code between mapbox-gl-js Typescript web applications
    * and {N} native applications easier.
    *
    * For the moment this method only supports a source type of 'geojson' or a source by id added
    * by addSource().
    *
    * Example style for a line:
    *
    * {
    * 'id': someid,
    * 'type': 'line',
    * 'source': {
    *   'type': 'geojson',
    *   'data': {
    *     "type": "Feature",
    *     "geometry": {
    *       "type": "LineString",
    *         "coordinates": [ [ lng, lat ], [ lng, lat ], ..... ]
    *       }
    *     }
    *   }
    * },
    * 'layout': {
    *   'line-cap': 'round',
    *   'line-join': 'round'
    * },
    * 'paint': {
    *   'line-color': '#ed6498',
    *   'line-width': 5,
    *   'line-opacity': .8,
    *   'line-dash-array': [ 1, 1, 1, ..]
    * }
    *
    * Do not call this method directly. Use addLayer().
    *
    * 'source' may also refer to a vector source
    *
    * 'source': {
    *    'type': 'vector',
    *    'url': '<url of vector source>'
    *  }
    *
    * or it may be a string referring to the id of an already added source as in
    *
    * 'source': '<id of source>'
    *
    * To enable catching of click events on a line, when a click handler is added
    * to a line (using the onMapEvent() method above), the Annotations plugin is used to
    * draw an invisible clickable line over the line layer. Sadly, the Annotations
    * plugin does not support all the nice styling options of the line Layer so we're
    * pushed into this compromise of drawing two lines, one for it's styling and the
    * other for it's click handling.
    *
    * @param {object} style - a style following the Mapbox style specification.
    * @param {any} nativeMapView - native map view (com.mapbox.mapboxsdk.maps.MapView)
    *
    * @return {Promise<any>}
    *
    * @see addLineAnnotation()
    * @see onMapEvent()
    *
    * @link https://docs.mapbox.com/mapbox-gl-js/style-spec/#layers
    * @link https://docs.mapbox.com/android/api/map-sdk/7.1.2/com/mapbox/mapboxsdk/maps/Style.html#addSource-com.mapbox.mapboxsdk.style.sources.Source-
    * @link https://docs.nativescript.org/core-concepts/android-runtime/marshalling/java-to-js#array-of-primitive-types
    */
    private addLineLayer;
    /**
    * Add a point to a line
    *
    * This method appends a point to a line and is useful for drawing a users track.
    *
    * @param {id} id - id of line to add a point to.
    * @param {array} lnglat - [lng,lat] to append to the line.
    *
    * @link https://github.com/mapbox/mapbox-gl-native/issues/13983
    * @link https://docs.mapbox.com/android/api/mapbox-java/libjava-geojson/3.0.1/com/mapbox/geojson/Feature.html#Feature--
    * @link https://docs.oracle.com/javase/8/docs/api/java/util/List.html
    *
    * @todo this does not update the invisible clickable overlay.
    */
    addLinePoint(id: string, lnglat: any, nativeMapView?: any): Promise<any>;
    /**
    * add a circle Layer
    *
    * Draw a circle based on a Mapbox style.
    *
    * Mapbox Native Android layers do not support click handlers. Unfortunately, we cannot use
    * the same Annotations approach that we do for lines to get a click handler because
    * circles drawn by the Annotations plugin do not support stops so there's no making them
    * smaller as we zoom out. Instead, we have our own click handler (see handleClickEvent() above)
    * to determine when a click has occured inside a circle.
    *
    * In order to support the click handler an additional circle-radius property, in meters, must
    * be included.
    *
    * {
    *  "id": someid,
    *  "type": 'circle',
    *  "radius-meters": 500,   // FIXME: radius in meters used for in-circle click detection.
    *  "source": {
    *    "type": 'geojson',
    *    "data": {
    *      "type": "Feature",
    *      "geometry": {
    *        "type": "Point",
    *        "coordinates": [ lng, lat ]
    *      }
    *    }
    *  },
    *  "paint": {
    *    "circle-radius": {
    *      "stops": [
    *        [0, 0],
    *        [20, 8000 ]
    *      ],
    *      "base": 2
    *    },
    *    'circle-opacity': 0.05,
    *    'circle-color': '#ed6498',
    *    'circle-stroke-width': 2,
    *    'circle-stroke-color': '#ed6498'
    *  }
    *
    * 'source' may also refer to a vector source
    *
    * 'source': {
    *    'type': 'vector',
    *    'url': '<url of vector source>'
    *  }
    *
    * or it may be a string referring to the id of an already added source as in
    *
    * 'source': '<id of source>'
    *
    * @param {object} style a Mapbox style describing the circle draw.
    * @param {object} nativeMap view.
    */
    private addCircleLayer;
    addGeoJsonClustered(options: AddGeoJsonClusteredOptions, nativeMap?: any): Promise<any>;
    /**
    * constantly center the map on the users location.
    */
    trackUser(options: TrackUserOptions, nativeMap?: any): Promise<void>;
    private static getAndroidColor;
    _getMapStyle(input: any): any;
    /**
    * Mapbox Map Options
    *
    * @link https://github.com/mapbox/mapbox-gl-native/wiki/Android-6.x-to-7.x-migration-guide
    * @link https://github.com/mapbox/mapbox-gl-native/blob/master/platform/android/MapboxGLAndroidSDK/src/main/java/com/mapbox/mapboxsdk/maps/MapboxMapOptions.java
    * @link https://docs.mapbox.com/android/api/map-sdk/7.1.2/com/mapbox/mapboxsdk/maps/MapboxMapOptions.html
    */
    _getMapboxMapOptions(settings: any): any;
    /**
    * convert string to camera mode constant.
    *
    * @link https://docs.mapbox.com/android/api/map-sdk/8.1.0/com/mapbox/mapboxsdk/location/modes/CameraMode.html
    */
    _stringToCameraMode(mode: UserLocationCameraMode): any;
    /**
    * convert string to render mode
    */
    _stringToRenderMode(mode: any): any;
    _fineLocationPermissionGranted(): boolean;
    _getRegionName(offlineRegion: any): any;
    /**
    * show a user location marker
    *
    * This method must not be called before location permissions have been granted.
    *
    * Supported options are:
    *
    * - elevation
    * - accuracyColor
    * - accuracyAlpha
    * - useDefaultLocationEngine
    * - renderMode
    * - cameraMode
    * - clickListener
    * - cameraTrackingChangeListener
    *
    * @param {object} options
    *
    * @link https://github.com/mapbox/mapbox-android-demo/blob/master/MapboxAndroidDemo/src/main/java/com/mapbox/mapboxandroiddemo/examples/location/LocationComponentOptionsActivity.java
    * @link https://developer.android.com/reference/android/graphics/Color
    *
    * @todo at least with simulated data, the location is only updated once hence adding support for forceLocation method.
    */
    showUserLocationMarker(options: any, nativeMap?: any): Promise<void>;
    /**
    * hide (destroy) the user location marker
    *
    * This method destroys the user location marker.
    */
    hideUserLocationMarker(nativeMap?: any): Promise<void>;
    /**
    * Change the mode of the user location marker
    *
    * Used to change the camera tracking and render modes of an existing
    * marker.
    *
    * The marker must be configured using showUserLocationMarker before this method
    * can called.
    */
    changeUserLocationMarkerMode(renderModeString: any, cameraModeString: UserLocationCameraMode, nativeMap?: any): Promise<any>;
    /**
    * force updating of user location
    *
    * This method forces the user location marker, if displayed, to move to a new location
    *
    * @todo figure out why the user location marker is not updating.
    */
    forceUserLocationUpdate(location: any, nativeMap?: any): Promise<void>;
    _getClickedMarkerDetails(clicked: any): any;
    _downloadImage(marker: any): Promise<unknown>;
    _downloadMarkerImages(markers: any): Promise<any[]>;
    /**
    * add a circle Annotation
    *
    * Draw a circle Annotation based on a GeoJSON feature..
    *
    * This method is not used but is left here for reference. At the present moment
    * these circles cannot be scaled according to zoom level (or other property).
    *
    * @param {object} geojson .
    * @param {object} nativeMap view.
    */
    private addCircleAnnotation;
    /**
    * add a line annotation
    *
    * Draws a line using the new Annotations plugin.
    *
    * NOTE: This is here just for reference.
    *
    * The Annotations plugin allows for listening to events on a line which the standard Layer
    * classes do not.
    *
    * However, what sucks is that:
    *
    * - Annotations do not provide the range of styling options that a line layer does
    * - Annotations use a GeoJSON format, where styling is done via a properties child, instead of the Mapbox Style format.
    *
    * {
    *   "type": "FeatureCollection",
    *   "features": [{
    *     "type": "Feature",
    *     "geometry": {
    *       "type": "LineString",
    *       "coordinates": [
    *         [ -76.947041, 39.007846 ],
    *         [ 12.5, 41.9 ]
    *       ]
    *     },
    *     "properties": {
    *       "line-color": "white",
    *       "line-width": "8",
    *       "is-draggable": false
    *     }
    *   }]
    * }
    *
    * @param {object} geojson - a GeoJSON feature collection.
    * @param {any} nativeMapView - native map view (com.mapbox.mapboxsdk.maps.MapView)
    *
    * @return {Promise<any>}
    *
    * @link https://docs.mapbox.com/android/api/plugins/annotation/0.5.0/com/mapbox/mapboxsdk/plugins/annotation/package-summary.html
    * @link https://docs.mapbox.com/android/api/map-sdk/7.1.2/com/mapbox/mapboxsdk/maps/Style.html#addSource-com.mapbox.mapboxsdk.style.sources.Source-
    */
    private addLineAnnotation;
    private testLineAnnotation;
    getTestCoords(): number[][];
}
