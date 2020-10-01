/// <reference path="platforms/ios/Mapbox.d.ts" />
import { AddExtrusionOptions, AddGeoJsonClusteredOptions, AddPolygonOptions, AddPolylineOptions, AddSourceOptions, AnimateCameraOptions, DeleteOfflineRegionOptions, DownloadOfflineRegionOptions, Feature, LatLng, ListOfflineRegionsOptions, MapboxApi, MapboxCommon, MapboxMarker, MapboxViewBase, MapStyle, OfflineRegion, QueryRenderedFeaturesOptions, SetCenterOptions, SetTiltOptions, SetViewportOptions, SetZoomLevelOptions, ShowOptions, TrackUserOptions, UserLocation, UserLocationCameraMode, Viewport } from "./mapbox.common";
export { MapStyle };
/**
* Map View Class instantiated from XML
*
* This class is created by the NativeScript XML view parsing
* code.
*/
export declare class MapboxView extends MapboxViewBase {
    private nativeMapView;
    private delegate;
    private settings;
    private initialized;
    private initCountHack;
    /**
    * programmatically include settings
    */
    setConfig(settings: any): void;
    getNativeMapView(): any;
    createNativeView(): Object;
    /**
    * init the native view.
    *
    * FIXME: It appears that the order of events is different between iOS and Android.
    * In the demo under Android, the main-page event handler is called first then the one
    * in the plugin. Under iOS it's the reverse.
    *
    * The symptom is that any properties that reference a binding aren't available
    * at the time this method is called. For example {{access_token}}.
    *
    * I'm sure there is something I do not understand about how this is supposed to work
    * and that the handstands below are not necessary.
    */
    initNativeView(): void;
    /**
    * when the view is destroyed.
    *
    * This is called by the framework when the view is destroyed (made not visible).
    *
    * However, it does not seem to be called when the page is unloaded.
    *
    * @link https://docs.nativescript.org/plugins/ui-plugin-custom
    */
    disposeNativeView(): Promise<void>;
    /**
    * returns a reference to the class Mapbox API shim instance
    *
    * @see Mapbox
    */
    getMapboxApi(): any;
    /**
    * initialize the map
    *
    * @see MGLMapViewDelegateImpl
    *
    * @todo FIXME: figure out why the accessToken property (which is using a binding in the demo XML) isn't set before we arrive here.
    */
    initMap(): void;
    onLayout(left: number, top: number, right: number, bottom: number): void;
}
/**
* a custom user location marker
*
* We want to add some behavior to the user location marker to visibly
* show the user when locations are being stored and when they are not.
*
* Sadly, it's not as easy under iOS as it is on Android. It involves
* creating a custom annotation view.
*
* @link https://docs.mapbox.com/ios/maps/examples/user-location-annotation/
*/
export declare class CustomUserLocationAnnotationView extends MGLUserLocationAnnotationView implements MGLUserLocationAnnotationView {
    size: number;
    dot: CALayer;
    arrow: CAShapeLayer;
    private userLocationRenderMode;
    private renderModeChanged;
    /**
    * init
    *
    * @link https://docs.nativescript.org/core-concepts/ios-runtime/HelloWorld
    */
    init(): this;
    /**
    * update
    *
    * The note from the Objective-C sample indicates this method may be called quite
    * often so it needs to be kept lightweight.
    */
    update(): void;
    /**
    * Draw the GPS tracking arrow.
    *
    * @link https://docs.nativescript.org/ns-framework-modules/color
    */
    drawTrackingLocationMarker(): void;
    /**
    * draw the non-tracking marker
    */
    drawNonTrackingLocationMarker(): void;
    /**
    * draw the tracking dot.
    */
    drawTrackingDot(): void;
    /**
    * draw the non-tracking dot.
    */
    drawNonTrackingDot(): void;
    /**
    * draw an arrow
    */
    drawArrow(): void;
    /**
    * update arrow heading
    *
    * @link https://docs.nativescript.org/core-concepts/ios-runtime/types/C-Functions
    */
    updateHeading(): void;
    /**
    * Calculate the vector path for an arrow
    */
    arrowPath(): any;
    /**
    * change Render mode
    *
    * @param {string} renderMode
    */
    changeUserLocationRenderMode(renderMode: any): void;
}
export declare class Mapbox extends MapboxCommon implements MapboxApi {
    private _mapboxMapInstance;
    private _mapboxViewInstance;
    private circles;
    private lines;
    private eventCallbacks;
    private userLocationRenderMode;
    /**
    * set the mapboxMapInstance
    *
    * @see MapboxView::initMap()
    */
    setMapboxMapInstance(mapboxMapInstance: any): void;
    /**
    * set the mapboxViewInstance
    *
    * @see MapboxView::initMap();
    */
    setMapboxViewInstance(mapboxViewInstance: any): void;
    /**
    * event handler shim
    *
    * Initialize our event handler shim so that we can intercept events here.
    *
    * @param { MapboxView } mapboxView
    */
    initEventHandlerShim(settings: any, mapboxNativeViewInstance: any): void;
    /**
    * register a map event handler
    *
    * The NativeScript ContentView base class as on() and off() methods.
    */
    onMapEvent(eventName: any, id: any, callback: any, nativeMapView?: any): void;
    offMapEvent(eventName: any, id: any, nativeMapView?: any): void;
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
    * create an display the map
    *
    * @todo FIXME: This method is not called. See MapboxView::initMap().
    */
    show(options: ShowOptions): Promise<any>;
    hide(): Promise<any>;
    unhide(): Promise<any>;
    destroy(nativeMap?: any): Promise<any>;
    /**
    * on Start
    */
    onStart(nativeMap?: any): Promise<any>;
    /**
    * on Resume
    */
    onResume(nativeMap?: any): Promise<any>;
    /**
    * on Pause
    */
    onPause(nativeMap?: any): Promise<any>;
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
    * explicitly set a map style
    */
    setMapStyle(style: string | MapStyle, nativeMap?: any): Promise<any>;
    addMarkers(markers: MapboxMarker[], nativeMap?: any): Promise<any>;
    removeMarkers(ids?: any, nativeMap?: any): Promise<any>;
    setCenter(options: SetCenterOptions, nativeMap?: any): Promise<any>;
    getCenter(nativeMap?: any): Promise<LatLng>;
    setZoomLevel(options: SetZoomLevelOptions, nativeMap?: any): Promise<any>;
    getZoomLevel(nativeMap?: any): Promise<number>;
    setTilt(options: SetTiltOptions, nativeMap?: any): Promise<any>;
    getTilt(nativeMap?: any): Promise<number>;
    getUserLocation(nativeMap?: any): Promise<UserLocation>;
    /**
    * convert string to camera mode constant.
    *
    * Supported modes on iOS are different than on Android.
    *
    * @todo come up with a reasonable set of cross platform defaults.
    */
    _stringToCameraMode(mode: UserLocationCameraMode): any;
    /**
     * convert string to render mode
     */
    _stringToRenderMode(mode: any): any;
    /**
    * show a user location marker
    *
    * This method must not be called before location permissions have been granted.
    *
    * Supported options under iOS are:
    *
    * - renderMode
    * - cameraMode
    * - clickListener
    *
    * Other options are ignored. Compare with the android version that supports a
    * different set of options.
    *
    * @param {object} options
    */
    showUserLocationMarker(options: any, nativeMap?: any): Promise<void>;
    /**
    * hide the user location marker
    *
    * @todo unfinished
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
    * ignored on iOS
    */
    forceUserLocationUpdate(location: any, nativeMap?: any): void;
    queryRenderedFeatures(options: QueryRenderedFeaturesOptions, nativeMap?: any): Promise<Array<Feature>>;
    addPolygon(options: AddPolygonOptions, nativeMap?: any): Promise<any>;
    addPolyline(options: AddPolylineOptions, nativeMap?: any): Promise<any>;
    private removePolyById;
    private removePolys;
    removePolygons(ids?: Array<any>, nativeMap?: any): Promise<any>;
    removePolylines(ids?: Array<any>, nativeMap?: any): Promise<any>;
    animateCamera(options: AnimateCameraOptions, nativeMap?: any): Promise<any>;
    /**
    * sets a map level click listener
    *
    */
    setOnMapClickListener(listener: (data: LatLng) => void, nativeMap?: any): Promise<any>;
    setOnMapLongClickListener(listener: (data: LatLng) => void, nativeMap?: any): Promise<any>;
    setOnScrollListener(listener: (data?: LatLng) => void, nativeMap?: any): Promise<void>;
    /**
    * simulates onMoveBegin single event callback
    *
    * This will call the listener provided once per pan akin to the way
    * onMoveBegin on the Android side works.
    */
    setOnMoveBeginListener(listener: (data?: LatLng) => void, nativeMap?: any): Promise<void>;
    setOnFlingListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraMoveListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraMoveCancelListener(listener: () => void, nativeMap?: any): Promise<any>;
    setOnCameraIdleListener(listener: () => void, nativeMap?: any): Promise<any>;
    getViewport(nativeMap?: any): Promise<Viewport>;
    setViewport(options: SetViewportOptions, nativeMap?: any): Promise<any>;
    downloadOfflineRegion(options: DownloadOfflineRegionOptions): Promise<any>;
    listOfflineRegions(options?: ListOfflineRegionsOptions): Promise<OfflineRegion[]>;
    deleteOfflineRegion(options: DeleteOfflineRegionOptions): Promise<any>;
    addExtrusion(options: AddExtrusionOptions, nativeMap?: any): Promise<any>;
    /**
    * add a vector or geojson source
    *
    * Add a source that can then be referenced in the style specification
    * passed to addLayer().
    *
    * @link https://docs.mapbox.com/mapbox-gl-js/api/#map#addsource
    */
    addSource(id: string, options: AddSourceOptions, nativeMap?: any): Promise<any>;
    /**
    * remove a vector source by id
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
    * - the source: must be a GeoJSON object.
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
    * For the moment this method only supports a source type of 'geojson'.
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
    *       "geometry": {
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
    * The process for adding a point to a line is different in the iOS sdk than in
    * the Android java sdk.
    *
    * @param {id} id - id of line to add a point to.
    * @param {array} lnglat - [lng,lat] to append to the line.
    *
    * @link https://github.com/mapbox/mapbox-gl-native/issues/13983
    * @link https://docs.mapbox.com/ios/maps/examples/runtime-animate-line/
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
    * @param {object} style a Mapbox style describing the circle draw.
    * @param {object} nativeMap view.
    *
    * @link https://github.com/NativeScript/NativeScript/issues/6971
    * @link https://stackoverflow.com/questions/54890753/how-to-call-objective-c-nsexpression-format-from-nativescript/54913932#54913932
    */
    private addCircleLayer;
    addGeoJsonClustered(options: AddGeoJsonClusteredOptions, nativeMap?: any): Promise<any>;
    /**
    *
    * @todo CHECK THIS
    
      addLayer(options: AddLayerOptions, nativeMap?): Promise<any> {
        return new Promise((resolve, reject) => {
          try {
            const { id, source, sourceLayer, type } = options;
            let theMap: MGLMapView = nativeMap || this._mapboxViewInstance;
            let layer;
    
            if (!theMap) {
              reject("No map has been loaded");
              return;
            }
    
            if (theMap.style.layerWithIdentifier(id)) {
              reject("Layer exists: " + id);
              return;
            }
    
            switch (type) {
              case "circle":
                const circleColor = !options.circleColor ? UIColor.blackColor : (options.circleColor instanceof Color ? options.circleColor.ios : new Color(options.circleColor).ios);
                const circleOpacity = options.circleOpacity === undefined ? 1 : options.circleOpacity;
                const circleRadius = options.circleRadius || 5;
                const circleStrokeColor = !options.circleStrokeColor ? UIColor.blackColor : (options.circleStrokeColor instanceof Color ? options.circleStrokeColor.ios : new Color(options.circleStrokeColor).ios);
                const circleStrokeWidth = options.circleStrokeWidth === undefined ? 2 : options.circleStrokeWidth;
    
                layer = MGLCircleStyleLayer.alloc().initWithIdentifierSource(id, theMap.style.sourceWithIdentifier(source));
                layer.sourceLayerIdentifier = sourceLayer;
    
                layer.circleColor = NSExpression.expressionForConstantValue(circleColor);
                layer.circleOpacity = NSExpression.expressionForConstantValue(circleOpacity);
                layer.circleRadius = NSExpression.expressionForConstantValue(circleRadius);
                layer.circleStrokeColor = NSExpression.expressionForConstantValue(circleStrokeColor);
                layer.circleStrokeWidth = NSExpression.expressionForConstantValue(circleStrokeWidth);
                break;
              case "fill":
                const fillColor = !options.fillColor ? UIColor.blackColor : (options.fillColor instanceof Color ? options.fillColor.ios : new Color(options.fillColor).ios);
                const fillOpacity = options.fillOpacity === undefined ? 1 : options.fillOpacity;
    
                layer = MGLFillStyleLayer.alloc().initWithIdentifierSource(id, theMap.style.sourceWithIdentifier(source));
                layer.sourceLayerIdentifier = sourceLayer;
    
                layer.fillColor = NSExpression.expressionForConstantValue(fillColor);
                layer.fillOpacity = NSExpression.expressionForConstantValue(fillOpacity);
                break;
              case "line":
                const lineCap = options.lineCap === undefined ? 'round' : options.lineCap;
                const lineJoin = options.lineJoin === undefined ? 'round' : options.lineJoin;
    
                const lineColor = options.lineColor === undefined ? UIColor.blackColor : (options.lineColor instanceof Color ? options.lineColor.ios : new Color(options.lineColor).ios);
                const lineOpacity = options.lineOpacity === undefined ? 1 : options.lineOpacity;
                const lineWidth = options.lineWidth === undefined ? 2 : options.lineWidth;
    
                layer = MGLLineStyleLayer.alloc().initWithIdentifierSource(id, theMap.style.sourceWithIdentifier(source));
                layer.sourceLayerIdentifier = sourceLayer;
    
                layer.lineCap = NSExpression.expressionForConstantValue(lineCap);
                layer.lineJoin = NSExpression.expressionForConstantValue(lineJoin);
                layer.lineColor = NSExpression.expressionForConstantValue(lineColor);
                layer.lineOpacity = NSExpression.expressionForConstantValue(lineOpacity);
                layer.lineWidth = NSExpression.expressionForConstantValue(lineWidth);
                break;
              default:
                reject("Invalid layer type: " + options.type);
                break;
            }
    
            if (!layer) {
              const ex = "No layer to add";
              console.log("Error in mapbox.addLayer: " + ex);
              reject(ex);
            }
            console.log('adding the layer!');
            console.log(layer);
            theMap.style.addLayer(layer);
            resolve();
          } catch (ex) {
            console.log("Error in mapbox.addLayer: " + ex);
            reject(ex);
          }
        });
      }
    
      removeLayer(id: string, nativeMap?): Promise<any> {
        return new Promise((resolve, reject) => {
          try {
            let theMap: MGLMapView = nativeMap || this._mapboxViewInstance;
    
            if (!theMap) {
              reject("No map has been loaded");
              return;
            }
    
            const layer = theMap.style.layerWithIdentifier(id);
            if (!layer) {
              reject("Layer does not exist");
              return;
            }
    
            theMap.style.removeLayer(layer);
            resolve();
          } catch (ex) {
            console.log("Error in mapbox.removeLayer: " + ex);
            reject(ex);
          }
        });
      }
    */
    trackUser(options: TrackUserOptions, nativeMap?: any): Promise<void>;
}
