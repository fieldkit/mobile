/// <reference path="./node_modules/tns-platform-declarations/ios.d.ts" />
/// <reference path="./platforms/ios/Mapbox.d.ts" />
import * as fs from "@nativescript/core/file-system";
import * as imgSrc from "@nativescript/core/image-source";
import * as utils from "@nativescript/core/utils/utils";
import * as http from "@nativescript/core/http";
import { Color } from "@nativescript/core/color";
import { MapboxCommon, MapboxViewBase, MapStyle } from "./mapbox.common";
import { GeoUtils } from './geo.utils';
// Export the enums for devs not using TS
export { MapStyle };
let _markers = [];
let _markerIconDownloadCache = [];
// let _mapView: MGLMapView;
// let _mapbox: any = {};
// let _delegate: any;
const _setMapboxMapOptions = (mapView, settings) => {
    mapView.logoView.hidden = settings.hideLogo;
    mapView.attributionButton.hidden = settings.hideAttribution;
    mapView.compassView.hidden = settings.hideCompass;
    mapView.rotateEnabled = !settings.disableRotation;
    mapView.scrollEnabled = !settings.disableScroll;
    mapView.zoomEnabled = !settings.disableZoom;
    mapView.allowsTilting = !settings.disableTilt;
    // mapView.showsScale = settings.showScale; // TODO, default false
    // mapView.showsHeading = true;
    // mapView.showsUserHeadingIndicator = true;
    if (settings.center && settings.center.lat && settings.center.lng) {
        let centerCoordinate = CLLocationCoordinate2DMake(settings.center.lat, settings.center.lng);
        mapView.setCenterCoordinateZoomLevelAnimated(centerCoordinate, settings.zoomLevel, false);
    }
    else {
        mapView.setZoomLevelAnimated(settings.zoomLevel, false);
    }
    mapView.showsUserLocation = settings.showUserLocation;
    mapView.autoresizingMask = 2 /* FlexibleWidth */ | 16 /* FlexibleHeight */;
};
const _getMapStyle = (input) => {
    if (/^mapbox:\/\/styles/.test(input) || /^http:\/\//.test(input) || /^https:\/\//.test(input)) {
        return NSURL.URLWithString(input);
    }
    else if (/^~\//.test(input)) {
        const assetPath = 'file://' + fs.knownFolders.currentApp().path + '/';
        input = input.replace(/^~\//, assetPath);
        return NSURL.URLWithString(input);
    }
    else if (input === MapStyle.LIGHT || input === MapStyle.LIGHT.toString()) {
        return MGLStyle.lightStyleURL;
    }
    else if (input === MapStyle.DARK || input === MapStyle.DARK.toString()) {
        return MGLStyle.darkStyleURL;
    }
    else if (input === MapStyle.OUTDOORS || input === MapStyle.OUTDOORS.toString()) {
        return MGLStyle.outdoorsStyleURL;
    }
    else if (input === MapStyle.SATELLITE || input === MapStyle.SATELLITE.toString()) {
        return MGLStyle.satelliteStyleURL;
    }
    else if (input === MapStyle.SATELLITE_STREETS || input === MapStyle.SATELLITE_STREETS.toString()) {
        return MGLStyle.satelliteStreetsStyleURL;
    }
    else if (input === MapStyle.TRAFFIC_DAY || input === MapStyle.TRAFFIC_DAY.toString()) {
        return NSURL.URLWithString("mapbox://styles/mapbox/traffic-day-v2");
    }
    else if (input === MapStyle.TRAFFIC_NIGHT || input === MapStyle.TRAFFIC_NIGHT.toString()) {
        return NSURL.URLWithString("mapbox://styles/mapbox/traffic-night-v2");
    }
    else {
        return MGLStyle.streetsStyleURL;
    }
};
const _getTrackingMode = (input) => {
    /*
      if (input === "FOLLOW") {
        return MGLUserTrackingMode.Follow;
      } else if (input === "FOLLOW_WITH_HEADING") {
        return MGLUserTrackingMode.FollowWithHeading;
      } else if (input === "FOLLOW_WITH_COURSE") {
        return MGLUserTrackingMode.FollowWithCourse;
      } else {
        return MGLUserTrackingMode.None;
      }
    */
    return 0 /* None */;
};
// ------------------------------------------------------------------------
/**
* Map View Class instantiated from XML
*
* This class is created by the NativeScript XML view parsing
* code.
*/
export class MapboxView extends MapboxViewBase {
    constructor() {
        super(...arguments);
        this.nativeMapView = null;
        this.delegate = null;
        this.settings = null;
        this.initialized = false;
        // see initMap. Count of how many times we've
        // tried to init the map.
        this.initCountHack = 50;
    }
    // ------------------------------------------------------
    /**
    * programmatically include settings
    */
    setConfig(settings) {
        console.log("MapboxView::setConfig(): settings:", settings);
        this.settings = settings;
    }
    // ------------------------------------------------------
    getNativeMapView() {
        return this.nativeMapView;
    }
    // ---------------------------------------------------------
    createNativeView() {
        console.log("MapboxView::createNativeView(): top");
        let v = super.createNativeView();
        return v;
    }
    // -------------------------------------------------------
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
    initNativeView() {
        console.log("MapboxView::initNativeView(): top");
        this.nativeView.owner = this;
        super.initNativeView();
        console.log("MapboxView::initNativeView(): after super.initNativeView()");
        // wait for the view to be fully loaded before initializing the map
        this.on('loaded', () => {
            console.log("MapboxView::initNativeView(): on - loaded");
            if (!this.initialized) {
                console.log("MapboxView::initNativeView(): initializing map");
                this.initMap();
                this.initialized = true;
            }
            else {
                console.log("MapboxView::initNativeView(): map already initialized.");
            }
        });
        this.on('unloaded', () => {
            console.log("MapboxView::initNativeView(): on - unloaded");
        });
    }
    // -------------------------------------------------------
    /**
    * when the view is destroyed.
    *
    * This is called by the framework when the view is destroyed (made not visible).
    *
    * However, it does not seem to be called when the page is unloaded.
    *
    * @link https://docs.nativescript.org/plugins/ui-plugin-custom
    */
    async disposeNativeView() {
        console.log("MapboxView::disposeNativeView(): top");
        this.nativeView.owner = null;
        await this.mapbox.destroy();
        console.log("MapboxView::disposeNativeView(): after mapbox.destroy()");
        super.disposeNativeView();
        console.log("MapboxView::disposeNativeView(): bottom");
    }
    // ---------------------------------------------------
    /**
    * returns a reference to the class Mapbox API shim instance
    *
    * @see Mapbox
    */
    getMapboxApi() {
        return this.mapbox;
    }
    // ----------------------------------------------------
    /**
    * initialize the map
    *
    * @see MGLMapViewDelegateImpl
    *
    * @todo FIXME: figure out why the accessToken property (which is using a binding in the demo XML) isn't set before we arrive here.
    */
    initMap() {
        console.log("MapboxView::initMap() top with settings:", this.settings);
        // FIXME: HACK: if we are arriving here because of an XML parse the property evaluations may not have
        // happened yet. This needs to be redone, but for the moment we'll assume the accessToken is done
        // via a property eval (since it really shouldn't be hard coded in XML).
        //
        // settings will only be set here if we are programmatically showing a map.
        if (!this.settings && !this.config.accessToken) {
            console.log("MapboxView::initMap() no access token. Race condition on XML property evaluation?");
            // If the user didn't specify an accessToken we don't want to loop forever
            if (this.initCountHack > 50) {
                return;
            }
            // FIXME: super ugly.
            setTimeout(() => {
                this.initMap();
            }, 50);
            this.initCountHack++;
            return;
        }
        if (!this.settings) {
            this.settings = Mapbox.merge(this.config, Mapbox.defaults);
        }
        else {
            this.settings = Mapbox.merge(this.settings, Mapbox.defaults);
        }
        if (!this.nativeMapView) {
            this.mapbox = new Mapbox();
            console.log("MapboxView::initMap(): after new Mapbox()");
            // called in a setTimeout call at the bottom.
            let drawMap = () => {
                MGLAccountManager.accessToken = this.settings.accessToken;
                this.nativeMapView = MGLMapView.alloc().initWithFrameStyleURL(CGRectMake(0, 0, this.nativeView.frame.size.width, this.nativeView.frame.size.height), _getMapStyle(this.settings.style));
                // this delegate class is defined later in this file and is where, in Obj-C land,
                // callbacks are delivered and handled.
                this.nativeMapView.delegate = this.delegate = MGLMapViewDelegateImpl.new().initWithCallback(() => {
                    console.log("MapboxView:initMap(): MLMapViewDeleteImpl onMapReady callback");
                    // FIXME: on the Android side the view is created in Mapbox::show(). On the iOS side it's created
                    // here in MapboxView, however the mapbox api still needs a reference to it.
                    this.mapbox.setMapboxViewInstance(this.nativeMapView);
                    this.notify({
                        eventName: MapboxViewBase.mapReadyEvent,
                        object: this,
                        map: this,
                        ios: this.nativeMapView
                    });
                    // no permission required, but to align with Android we fire the event anyway
                    this.notify({
                        eventName: MapboxViewBase.locationPermissionGrantedEvent,
                        object: this,
                        map: this,
                        ios: this.nativeMapView
                    });
                });
                _setMapboxMapOptions(this.nativeMapView, this.settings);
                _markers = [];
                this.nativeView.addSubview(this.nativeMapView);
                // this.notify will notify an event listener specified
                // in the XML, in this case (onMoveBegin)="..."
                this.mapbox.setOnMoveBeginListener((data) => {
                    console.log("MapboxView::initMap(): onMoveBegin listener");
                    this.notify({
                        eventName: MapboxViewBase.moveBeginEvent,
                        object: this,
                        map: this,
                        ios: this.nativeMapView
                    });
                }, this.nativeMapView);
            };
            // draw the map after a timeout
            setTimeout(drawMap, this.settings.delay ? this.settings.delay : 0);
        }
    } // end of initMap()
    // ----------------------------------
    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        if (this.nativeMapView) {
            this.nativeMapView.layer.frame = this.ios.layer.bounds;
        }
    }
}
// -----------------------------------------------------------------------------------------------------------------------
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
export class CustomUserLocationAnnotationView extends MGLUserLocationAnnotationView {
    /**
    * init
    *
    * @link https://docs.nativescript.org/core-concepts/ios-runtime/HelloWorld
    */
    init() {
        this.size = 48;
        super.initWithFrame(CGRectMake(0, 0, this.size, this.size));
        this.renderModeChanged = true;
        this.userLocationRenderMode = 'NORMAL';
        return this;
    }
    /**
    * update
    *
    * The note from the Objective-C sample indicates this method may be called quite
    * often so it needs to be kept lightweight.
    */
    update() {
        if (CLLocationCoordinate2DIsValid(this.userLocation.coordinate)) {
            // if it's the first time here, setup the layers that make up the
            // location marker.
            if (!this.dot) {
                this.drawNonTrackingLocationMarker();
            }
            if (this.userLocationRenderMode == 'GPS') {
                this.updateHeading();
            }
        }
    }
    /**
    * Draw the GPS tracking arrow.
    *
    * @link https://docs.nativescript.org/ns-framework-modules/color
    */
    drawTrackingLocationMarker() {
        console.log("CustomerUserLocationAnnotatinView::drawTrackingLocationMarker()");
        this.drawTrackingDot();
        this.drawArrow();
    } // end of setupLayers()
    /**
    * draw the non-tracking marker
    */
    drawNonTrackingLocationMarker() {
        console.log("CustomerUserLocationAnnotatinView::drawNonTrackingLocationMarker()");
        this.drawNonTrackingDot();
        if (this.arrow) {
            this.arrow.removeFromSuperlayer();
            this.arrow = null;
        }
    }
    /**
    * draw the tracking dot.
    */
    drawTrackingDot() {
        this.size = 48;
        // we need to adjust the size of the bounds of the marker. The Tracking marker
        // is larger than the non tracking marker.
        this.bounds = CGRectMake(0, 0, this.size, this.size);
        let dot = CALayer.layer();
        dot.frame = this.bounds;
        // user corner radius to turn the layer into a circle
        dot.cornerRadius = this.size / 2;
        dot.backgroundColor = this.tintColor.CGColor;
        dot.borderWidth = 4;
        let whiteColor = new Color("#FFFFFF");
        dot.borderColor = whiteColor.ios.CGColor;
        if (!this.dot) {
            this.layer.addSublayer(dot);
        }
        else {
            this.layer.replaceSublayerWith(this.dot, dot);
        }
        // QUESTION: does GC catch this?
        this.dot = dot;
    }
    /**
    * draw the non-tracking dot.
    */
    drawNonTrackingDot() {
        this.size = 24;
        this.bounds = CGRectMake(0, 0, this.size, this.size);
        let dot = CALayer.layer();
        dot.frame = this.bounds;
        // user corner radius to turn the layer into a circle
        dot.cornerRadius = this.size / 2;
        dot.backgroundColor = this.tintColor.CGColor;
        dot.borderWidth = 1;
        let whiteColor = new Color("#FFFFFF");
        dot.borderColor = whiteColor.ios.CGColor;
        if (!this.dot) {
            this.layer.addSublayer(dot);
        }
        else {
            this.layer.replaceSublayerWith(this.dot, dot);
        }
        // QUESTION: does GC catch this?
        this.dot = dot;
    }
    /**
    * draw an arrow
    */
    drawArrow() {
        let arrow = CAShapeLayer.layer();
        arrow.path = this.arrowPath();
        arrow.frame = CGRectMake(0, 0, this.size / 2, this.size / 2);
        arrow.position = CGPointMake(CGRectGetMidX(this.dot.frame), CGRectGetMidY(this.dot.frame));
        arrow.fillColor = this.dot.borderColor;
        if (!this.arrow) {
            this.layer.addSublayer(arrow);
        }
        else {
            this.layer.replaceSublayerWith(this.arrow, arrow);
        }
        // QUESTION: Does GC catch this?
        this.arrow = arrow;
    }
    /**
    * update arrow heading
    *
    * @link https://docs.nativescript.org/core-concepts/ios-runtime/types/C-Functions
    */
    updateHeading() {
        // just to avoid a possible race condition where the arrow isnt' drawn yet
        if (!this.arrow) {
            return;
        }
        if (typeof this.userLocation == 'undefined') {
            return;
        }
        if ((typeof this.userLocation.heading == 'undefined') || (this.userLocation.heading === null)) {
            return;
        }
        if ((typeof this.userLocation.heading.trueHeading == 'undefined') || (this.userLocation.heading.trueHeading === null)) {
            return;
        }
        if (this.userLocation.heading.trueHeading > 0) {
            this.arrow.hidden = false;
            // get the difference between the map's current direction and the
            // user's heading, then convert it from degrees to radians
            //
            // The original Objective-C example uses the inline C function MGLRadiansFromDegrees but because
            // it's declared as inline it is not available for NativeScript. See linked article above.
            // let rotation : number = MGLRadiansFromDegrees( this.mapView.direction - this.userLocation.heading.trueHeading );
            let degrees = this.mapView.direction - this.userLocation.heading.trueHeading;
            // in radians
            let rotation = degrees * Math.PI / 180;
            rotation = -rotation;
            // if the difference would be perceptible, rotate the arrow.
            if (fabs(rotation) > 0.01) {
                // Disable implicit animations of this rotation, which reduces lag between updates
                CATransaction.begin();
                CATransaction.setDisableActions(true);
                this.arrow.setAffineTransform(CGAffineTransformRotate(CGAffineTransformIdentity, rotation));
                CATransaction.commit();
            }
        }
        else {
            this.arrow.hidden = true;
        }
    }
    /**
    * Calculate the vector path for an arrow
    */
    arrowPath() {
        let max = this.size / 2;
        let pad = 3;
        let top = CGPointMake(max * 0.5, 0);
        let left = CGPointMake(0 + pad, max - pad);
        let right = CGPointMake(max - pad, max - pad);
        let center = CGPointMake(max * 0.5, max * 0.6);
        let bezierPath = UIBezierPath.bezierPath();
        bezierPath.moveToPoint(top);
        bezierPath.addLineToPoint(left);
        bezierPath.addLineToPoint(center);
        bezierPath.addLineToPoint(right);
        bezierPath.addLineToPoint(top);
        bezierPath.closePath();
        return bezierPath.CGPath;
    }
    /**
    * change Render mode
    *
    * @param {string} renderMode
    */
    changeUserLocationRenderMode(renderMode) {
        console.log("CustomUserLocationAnnotatinView::changeUserLocationRenderMode(): changing mode to '" + renderMode + "'");
        this.userLocationRenderMode = renderMode;
        if (renderMode == 'GPS') {
            this.drawTrackingLocationMarker();
        }
        else {
            this.drawNonTrackingLocationMarker();
        }
    }
} // end of class CustomUserLocationAnnotationView
// ----------------------------------------------------------------------
export class Mapbox extends MapboxCommon {
    constructor() {
        // reference to the native mapbox API
        super(...arguments);
        // list of circle layers
        this.circles = [];
        // list of polylines
        this.lines = [];
        // registered callbacks.
        this.eventCallbacks = [];
    }
    // --------------------------------------------------------------------
    /**
    * set the mapboxMapInstance
    *
    * @see MapboxView::initMap()
    */
    setMapboxMapInstance(mapboxMapInstance) {
        this._mapboxMapInstance = mapboxMapInstance;
    }
    // --------------------------------------------------------------------
    /**
    * set the mapboxViewInstance
    *
    * @see MapboxView::initMap();
    */
    setMapboxViewInstance(mapboxViewInstance) {
        this._mapboxViewInstance = mapboxViewInstance;
    }
    // --------------------------------------------------------------------
    /**
    * event handler shim
    *
    * Initialize our event handler shim so that we can intercept events here.
    *
    * @param { MapboxView } mapboxView
    */
    initEventHandlerShim(settings, mapboxNativeViewInstance) {
        console.log("Mapbox:initEventHandlerShim(): top");
        this.setOnMapClickListener((point) => {
            return this.checkForCircleClickEvent(point);
        }, mapboxNativeViewInstance);
    }
    // --------------------------------------------------------------------------------
    /**
    * register a map event handler
    *
    * The NativeScript ContentView base class as on() and off() methods.
    */
    onMapEvent(eventName, id, callback, nativeMapView) {
    }
    // -------------------------------------------------------------------------------
    offMapEvent(eventName, id, nativeMapView) {
    }
    // ------------------------------------------------------------------------
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
    checkForCircleClickEvent(point) {
        console.log("Mapbox:checkForCircleClickEvent(): got click event with point:", point);
        // is this point within a circle?
        for (let i = 0; i < this.circles.length; i++) {
            console.log("Mapbox:checkForCircleClickEvent(): checking circle with radius:", this.circles[i].radius);
            if (GeoUtils.isLocationInCircle(point.lng, point.lat, this.circles[i].center[0], this.circles[i].center[1], this.circles[i].radius)) {
                console.log("Mapbox:checkForCircleClickEvent() Point is in circle with id '" + this.circles[i].id + "' invoking callbacks, if any. Callback list is:", this.eventCallbacks);
                for (let x = 0; x < this.eventCallbacks['click'].length; x++) {
                    let entry = this.eventCallbacks['click'][x];
                    if (entry.id == this.circles[i].id) {
                        console.log("Mapbox:checkForCircleClickEvent(): calling callback for '" + entry.id + "'");
                        return entry.callback(point);
                    }
                } // end of for loop over events.
            }
        } // end of loop over circles.
        return false;
    } // end of checkForCircleClickEvent()
    // -------------------------------------------------------------------------------
    /**
    * create an display the map
    *
    * @todo FIXME: This method is not called. See MapboxView::initMap().
    */
    show(options) {
        console.log("Mapbox::show(): top with options:", options);
        return new Promise((resolve, reject) => {
            try {
                const settings = Mapbox.merge(options, Mapbox.defaults);
                // let directions = MBDirections.alloc().initWithAccessToken(arg.accessToken);
                // alert("directions: " + directions);
                // if no accessToken was set the app may crash
                if (settings.accessToken === undefined) {
                    reject("Please set the 'accessToken' parameter");
                    return;
                }
                // if already added, make sure it's removed first
                if (this._mapboxViewInstance) {
                    this._mapboxViewInstance.removeFromSuperview();
                }
                const view = UIApplication.sharedApplication.keyWindow.rootViewController.view, frameRect = view.frame, mapFrame = CGRectMake(settings.margins.left, settings.margins.top, frameRect.size.width - settings.margins.left - settings.margins.right, frameRect.size.height - settings.margins.top - settings.margins.bottom), styleURL = _getMapStyle(settings.style);
                MGLAccountManager.accessToken = settings.accessToken;
                this._mapboxViewInstance = MGLMapView.alloc().initWithFrameStyleURL(mapFrame, styleURL);
                _setMapboxMapOptions(this._mapboxViewInstance, settings);
                this._mapboxViewInstance.delegate = MGLMapViewDelegateImpl.new().initWithCallback((mapView) => {
                    resolve({
                        ios: mapView
                    });
                });
                _markers = [];
                _addMarkers(settings.markers);
                // wrapping in a little timeout since the map area tends to flash black a bit initially
                setTimeout(() => {
                    view.addSubview(this._mapboxViewInstance);
                }, 500);
            }
            catch (ex) {
                console.log("Error in mapbox.show: " + ex);
                reject(ex);
            }
        });
    }
    hide() {
        return new Promise((resolve, reject) => {
            try {
                if (this._mapboxViewInstance) {
                    this._mapboxViewInstance.removeFromSuperview();
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.hide: " + ex);
                reject(ex);
            }
        });
    }
    unhide() {
        return new Promise((resolve, reject) => {
            try {
                if (this._mapboxViewInstance) {
                    let view = UIApplication.sharedApplication.keyWindow.rootViewController.view;
                    view.addSubview(this._mapboxViewInstance);
                    resolve();
                }
                else {
                    reject("No map found");
                }
            }
            catch (ex) {
                console.log("Error in mapbox.unhide: " + ex);
                reject(ex);
            }
        });
    }
    destroy(nativeMap) {
        return new Promise((resolve, reject) => {
            const theMap = nativeMap || this._mapboxViewInstance;
            if (theMap) {
                theMap.removeFromSuperview();
                theMap.delegate = null;
            }
            resolve();
        });
    }
    // ----------------------------------------
    // Life Cycle Hooks - Required on Android
    // ----------------------------------------
    /**
    * on Start
    */
    onStart(nativeMap) {
        return Promise.resolve();
    }
    // ----------------------------------------------
    /**
    * on Resume
    */
    onResume(nativeMap) {
        return Promise.resolve();
    }
    // ----------------------------------------------
    /**
    * on Pause
    */
    onPause(nativeMap) {
        return Promise.resolve();
    }
    // ----------------------------------------------
    /**
    * on Stop
    */
    onStop(nativeMap) {
        return Promise.resolve();
    }
    // ----------------------------------------------
    /**
    * on Low Memory
    */
    onLowMemory(nativeMap) {
        return Promise.resolve();
    }
    // ----------------------------------------------
    /**
    * on Destroy
    */
    onDestroy(nativeMap) {
        return Promise.resolve();
    }
    // ---------------------------------------------
    // onSaveInstanceState( Bundle outState)
    // ----------------------------------------
    /**
    * explicitly set a map style
    */
    setMapStyle(style, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMap || this._mapboxViewInstance;
                // the style takes some time to load so we have to set a callback
                // to wait for the style to finish loading
                let delegate = theMap.delegate;
                delegate.setStyleLoadedCallback((mapView) => {
                    console.log("Mapbox:setMapStyle(): style loaded callback returned.");
                    resolve();
                });
                theMap.styleURL = _getMapStyle(style);
            }
            catch (ex) {
                console.log("Error in mapbox.setMapStyle: " + ex);
                reject(ex);
            }
        });
    }
    // --------------------------------------------
    addMarkers(markers, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMap || this._mapboxViewInstance;
                _addMarkers(markers, theMap);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.addMarkers: " + ex);
                reject(ex);
            }
        });
    }
    removeMarkers(ids, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMap || this._mapboxViewInstance;
                let markersToRemove = [];
                _markers.forEach(marker => {
                    if (!ids || (marker.id && ids.indexOf(marker.id) > -1)) {
                        markersToRemove.push(marker.ios);
                    }
                });
                // remove markers from cache
                if (ids) {
                    _markers = _markers.filter(marker => ids.indexOf(marker.id) < 0);
                }
                else {
                    _markers = [];
                }
                if (markersToRemove.length > 0) {
                    theMap.removeAnnotations(markersToRemove);
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.removeMarkers: " + ex);
                reject(ex);
            }
        });
    }
    setCenter(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                let animated = options.animated === undefined || options.animated;
                let coordinate = CLLocationCoordinate2DMake(options.lat, options.lng);
                theMap.setCenterCoordinateAnimated(coordinate, animated);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setCenter: " + ex);
                reject(ex);
            }
        });
    }
    getCenter(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                let coordinate = theMap.centerCoordinate;
                resolve({
                    lat: coordinate.latitude,
                    lng: coordinate.longitude
                });
            }
            catch (ex) {
                console.log("Error in mapbox.getCenter: " + ex);
                reject(ex);
            }
        });
    }
    setZoomLevel(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                let animated = options.animated === undefined || options.animated;
                let level = options.level;
                if (level >= 0 && level <= 20) {
                    theMap.setZoomLevelAnimated(level, animated);
                    resolve();
                }
                else {
                    reject("invalid ZoomLevel, use any double value from 0 to 20 (like 8.3)");
                }
            }
            catch (ex) {
                console.log("Error in mapbox.setZoomLevel: " + ex);
                reject(ex);
            }
        });
    }
    getZoomLevel(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                resolve(theMap.zoomLevel);
            }
            catch (ex) {
                console.log("Error in mapbox.getZoomLevel: " + ex);
                reject(ex);
            }
        });
    }
    setTilt(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                let cam = theMap.camera;
                cam.pitch = options.tilt;
                const durationMs = options.duration ? options.duration : 5000;
                theMap.setCameraWithDurationAnimationTimingFunction(cam, durationMs / 1000, CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionEaseInEaseOut));
                setTimeout(() => {
                    resolve();
                }, durationMs);
            }
            catch (ex) {
                console.log("Error in mapbox.setTilt: " + ex);
                reject(ex);
            }
        });
    }
    getTilt(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                resolve(theMap.camera.pitch);
            }
            catch (ex) {
                console.log("Error in mapbox.getTilt: " + ex);
                reject(ex);
            }
        });
    }
    getUserLocation(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                const loc = theMap.userLocation;
                if (loc === null) {
                    reject("Location not available");
                }
                else {
                    resolve({
                        location: {
                            lat: loc.coordinate.latitude,
                            lng: loc.coordinate.longitude
                        },
                        speed: loc.location ? loc.location.speed : 0
                    });
                }
            }
            catch (ex) {
                console.log("Error in mapbox.getUserLocation: " + ex);
                reject(ex);
            }
        });
    }
    /**
    * convert string to camera mode constant.
    *
    * Supported modes on iOS are different than on Android.
    *
    * @todo come up with a reasonable set of cross platform defaults.
    */
    _stringToCameraMode(mode) {
        switch (mode) {
            case "NONE":
                return 0 /* None */;
            case "NONE_COMPASS":
                console.log("MapboxView::_stringToCameraMode(): NONE_COMPASS unsupported on iOS");
                return 0 /* None */;
            case "NONE_GPS":
                console.log("MapboxView::_stringToCameraMode(): NONE_GPS unsupported on iOS");
                return 0 /* None */;
            case "TRACKING":
                return 1 /* Follow */;
            case "TRACK_COMPASS":
                return 2 /* FollowWithHeading */;
            case "TRACKING_GPS":
                // a reasonable approximation.
                return 1 /* Follow */;
            case "TRACK_GPS_NORTH":
                return 3 /* FollowWithCourse */;
        }
    }
    /**
     * convert string to render mode
     */
    _stringToRenderMode(mode) {
        let renderMode;
        switch (mode) {
            case 'NORMAL':
                return 'NORMAL';
            case 'COMPASS':
                return 'COMPASS';
            case 'GPS':
                return 'GPS';
        }
    }
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
    showUserLocationMarker(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                // userLocation marker.
                theMap.showsUserLocation = true;
                theMap.userTrackingMode = this._stringToCameraMode(options.cameraMode);
                theMap.showsUserHeadingIndicator = true;
                this.userLocationRenderMode = this._stringToRenderMode(options.renderMode);
                // the "delegate" needs to know the modes
                let delegate = theMap.delegate;
                // tell the delegate to tell the CustomerLocationAnnotationView to change the
                // appearance of the marker.
                delegate.changeUserLocationRenderMode(this.userLocationRenderMode);
                if (typeof options.clickListener != 'undefined') {
                    delegate.setUserLocationClickListener(options.clickListener);
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.getUserLocation: " + ex);
                reject(ex);
            }
        });
    }
    // ------------------------------------------------------------------------------
    /**
    * hide the user location marker
    *
    * @todo unfinished
    */
    hideUserLocationMarker(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.getUserLocation: " + ex);
                reject(ex);
            }
        });
    }
    // --------------------------------------------------------------------------------
    /**
    * Change the mode of the user location marker
    *
    * Used to change the camera tracking and render modes of an existing
    * marker.
    *
    * The marker must be configured using showUserLocationMarker before this method
    * can called.
    */
    changeUserLocationMarkerMode(renderModeString, cameraModeString, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                console.log("Mapbox::changeUserLocationMarkerMode(): changing renderMode to '" + renderModeString + "' cameraMode '" + cameraModeString + "'");
                theMap.userTrackingMode = this._stringToCameraMode(cameraModeString);
                let delegate = theMap.delegate;
                let renderMode = this._stringToRenderMode(renderModeString);
                delegate.changeUserLocationRenderMode(renderMode);
            }
            catch (ex) {
                console.log("Error in mapbox.showUserLocationMarker: " + ex);
                reject(ex);
            }
        });
    }
    /**
    * ignored on iOS
    */
    forceUserLocationUpdate(location, nativeMap) {
    }
    // --------------------------------------------------------------
    queryRenderedFeatures(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMap || this._mapboxViewInstance;
                const point = options.point;
                if (point === undefined) {
                    reject("Please set the 'point' parameter");
                    return;
                }
                const { x, y } = theMap.convertCoordinateToPointToView({ latitude: point.lat, longitude: point.lng }, theMap);
                const features = theMap.visibleFeaturesAtPoint({ x, y });
                const result = [];
                for (let i = 0; i < features.count; i++) {
                    const feature = features.objectAtIndex(i);
                    const properties = [];
                    if (feature.attributes && feature.attributes.count > 0) {
                        const keys = utils.iOSNativeHelper.collections.nsArrayToJSArray(feature.attributes.allKeys);
                        for (let key of keys) {
                            properties.push({
                                key,
                                value: feature.attributes.valueForKey(key),
                            });
                        }
                    }
                    result.push({
                        id: feature.identifier,
                        properties,
                    });
                }
                resolve(result);
            }
            catch (ex) {
                console.log("Error in mapbox.queryRenderedFeatures: " + ex);
                reject(ex);
            }
        });
    }
    addPolygon(options, nativeMap) {
        return new Promise((resolve, reject) => {
            const theMap = nativeMap || this._mapboxViewInstance;
            const points = options.points;
            if (points === undefined) {
                reject("Please set the 'points' parameter");
                return;
            }
            const coordinateArray = [];
            points.forEach(point => coordinateArray.push([point.lng, point.lat]));
            const polygonID = `polygon_${options.id || new Date().getTime()}`;
            if (theMap.style.sourceWithIdentifier(polygonID)) {
                reject("Remove the polygon with this id first with 'removePolygons': " + polygonID);
                return;
            }
            const geoJSON = `{
        "type": "FeatureCollection",
        "features": [
          {
            "id": ${JSON.stringify(polygonID)},
            "type": "Feature",
            "properties": {
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [${JSON.stringify(coordinateArray)}]
            }
          }
        ]
      }`;
            const geoDataStr = NSString.stringWithString(geoJSON);
            const geoData = geoDataStr.dataUsingEncoding(NSUTF8StringEncoding);
            const geoDataBase64Enc = geoData.base64EncodedStringWithOptions(0);
            const geo = NSData.alloc().initWithBase64EncodedStringOptions(geoDataBase64Enc, null);
            const shape = MGLShape.shapeWithDataEncodingError(geo, NSUTF8StringEncoding);
            const source = MGLShapeSource.alloc().initWithIdentifierShapeOptions(polygonID, shape, null);
            theMap.style.addSource(source);
            if (options.strokeColor || options.strokeWidth || options.strokeOpacity) {
                const strokeLayer = MGLLineStyleLayer.alloc().initWithIdentifierSource(polygonID + "_stroke", source);
                strokeLayer.lineColor = NSExpression.expressionForConstantValue(!options.strokeColor ? UIColor.blackColor : (options.strokeColor instanceof Color ? options.strokeColor.ios : new Color(options.strokeColor).ios));
                strokeLayer.lineWidth = NSExpression.expressionForConstantValue(options.strokeWidth || 5);
                strokeLayer.lineOpacity = NSExpression.expressionForConstantValue(options.strokeOpacity === undefined ? 1 : options.strokeOpacity);
                theMap.style.addLayer(strokeLayer);
            }
            const layer = MGLFillStyleLayer
                .alloc()
                .initWithIdentifierSource(polygonID, source);
            layer.fillColor = NSExpression.expressionForConstantValue(!options.fillColor ? UIColor.blackColor : (options.fillColor instanceof Color ? options.fillColor.ios : new Color(options.fillColor).ios));
            layer.fillOpacity = NSExpression.expressionForConstantValue(options.fillOpacity === undefined ? 1 : options.fillOpacity);
            theMap.style.addLayer(layer);
            resolve();
        });
    }
    // --------------------------------------------------------------------
    addPolyline(options, nativeMap) {
        return new Promise((resolve, reject) => {
            const theMap = nativeMap || this._mapboxViewInstance;
            const points = options.points;
            if (points === undefined) {
                reject("Please set the 'points' parameter");
                return;
            }
            const coordinateArray = [];
            points.forEach(point => coordinateArray.push([point.lng, point.lat]));
            const polylineID = "polyline_" + (options.id || new Date().getTime());
            // this would otherwise crash the app
            if (theMap.style.sourceWithIdentifier(polylineID)) {
                reject("Remove the polyline with this id first with 'removePolylines': " + polylineID);
                return;
            }
            const geoJSON = `{"type": "FeatureCollection", "features": [{"type": "Feature","properties": {},"geometry": {"type": "LineString", "coordinates": ${JSON.stringify(coordinateArray)}}}]}`;
            const geoDataStr = NSString.stringWithString(geoJSON);
            const geoData = geoDataStr.dataUsingEncoding(NSUTF8StringEncoding);
            const geoDataBase64Enc = geoData.base64EncodedStringWithOptions(0);
            const geo = NSData.alloc().initWithBase64EncodedStringOptions(geoDataBase64Enc, null);
            const shape = MGLShape.shapeWithDataEncodingError(geo, NSUTF8StringEncoding);
            const source = MGLShapeSource.alloc().initWithIdentifierShapeOptions(polylineID, shape, null);
            theMap.style.addSource(source);
            const layer = MGLLineStyleLayer.alloc().initWithIdentifierSource(polylineID, source);
            layer.lineColor = NSExpression.expressionForConstantValue(!options.color ? UIColor.blackColor : (options.color instanceof Color ? options.color.ios : new Color(options.color).ios));
            layer.lineWidth = NSExpression.expressionForConstantValue(options.width || 5);
            layer.lineOpacity = NSExpression.expressionForConstantValue(options.opacity === undefined ? 1 : options.opacity);
            theMap.style.addLayer(layer);
            resolve();
        });
    }
    // --------------------------------------------------------------------
    removePolyById(theMap, id) {
        let layer = theMap.style.layerWithIdentifier(id);
        if (layer !== null) {
            theMap.style.removeLayer(layer);
        }
        // polygons may have a 'stroke' layer
        layer = theMap.style.layerWithIdentifier(id + "_stroke");
        if (layer !== null) {
            theMap.style.removeLayer(layer);
        }
        const source = theMap.style.sourceWithIdentifier(id);
        if (source !== null) {
            theMap.style.removeSource(source);
        }
    }
    removePolys(polyType, ids, nativeMap) {
        return new Promise((resolve) => {
            let theMap = nativeMap || this._mapboxViewInstance;
            ids.forEach(id => this.removePolyById(theMap, polyType + id));
            resolve();
        });
    }
    removePolygons(ids, nativeMap) {
        return this.removePolys("polygon_", ids, nativeMap);
    }
    removePolylines(ids, nativeMap) {
        return this.removePolys("polyline_", ids, nativeMap);
    }
    animateCamera(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                let target = options.target;
                if (target === undefined) {
                    reject("Please set the 'target' parameter");
                    return;
                }
                let cam = theMap.camera;
                cam.centerCoordinate = CLLocationCoordinate2DMake(target.lat, target.lng);
                if (options.altitude) {
                    cam.altitude = options.altitude;
                }
                if (options.bearing) {
                    cam.heading = options.bearing;
                }
                if (options.tilt) {
                    cam.pitch = options.tilt;
                }
                let durationMs = options.duration ? options.duration : 10000;
                theMap.setCameraWithDurationAnimationTimingFunction(cam, durationMs / 1000, CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionEaseInEaseOut));
                setTimeout(() => {
                    resolve();
                }, durationMs);
            }
            catch (ex) {
                console.log("Error in mapbox.animateCamera: " + ex);
                reject(ex);
            }
        });
    }
    // ------------------------------------------------------------------------------
    /**
    * sets a map level click listener
    *
    */
    setOnMapClickListener(listener, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                // adding the tap handler to the map object so it's not garbage collected.
                theMap['mapTapHandler'] = MapTapHandlerImpl.initWithOwnerAndListenerForMap(new WeakRef(this), listener, theMap);
                const tapGestureRecognizer = UITapGestureRecognizer.alloc().initWithTargetAction(theMap['mapTapHandler'], "tap");
                // cancel the default tap handler
                for (let i = 0; i < theMap.gestureRecognizers.count; i++) {
                    let recognizer = theMap.gestureRecognizers.objectAtIndex(i);
                    if (recognizer instanceof UITapGestureRecognizer) {
                        tapGestureRecognizer.requireGestureRecognizerToFail(recognizer);
                    }
                }
                theMap.addGestureRecognizer(tapGestureRecognizer);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setOnMapClickListener: " + ex);
                reject(ex);
            }
        });
    }
    setOnMapLongClickListener(listener, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                // adding the longPress handler to the map oject so it's not GC'd
                theMap['mapLongPressHandler'] = MapLongPressHandlerImpl.initWithOwnerAndListenerForMap(new WeakRef(this), listener, theMap);
                const longPressGestureRecognizer = UILongPressGestureRecognizer.alloc().initWithTargetAction(theMap['mapLongPressHandler'], "longPress");
                // cancel the default longPress handler
                for (let i = 0; i < theMap.gestureRecognizers.count; i++) {
                    let recognizer = theMap.gestureRecognizers.objectAtIndex(i);
                    if (recognizer instanceof UILongPressGestureRecognizer) {
                        longPressGestureRecognizer.requireGestureRecognizerToFail(recognizer);
                    }
                }
                theMap.addGestureRecognizer(longPressGestureRecognizer);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setOnMapClickListener: " + ex);
                reject(ex);
            }
        });
    }
    setOnScrollListener(listener, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                // adding the pan handler to the map oject so it's not GC'd
                theMap['mapPanHandler'] = MapPanHandlerImpl.initWithOwnerAndListenerForMap(new WeakRef(this), listener, theMap);
                // there's already a pan recognizer, so find it and attach a target action
                for (let i = 0; i < theMap.gestureRecognizers.count; i++) {
                    let recognizer = theMap.gestureRecognizers.objectAtIndex(i);
                    if (recognizer instanceof UIPanGestureRecognizer) {
                        recognizer.addTargetAction(theMap['mapPanHandler'], "pan");
                        break;
                    }
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setOnScrollListener: " + ex);
                reject(ex);
            }
        });
    }
    /**
    * simulates onMoveBegin single event callback
    *
    * This will call the listener provided once per pan akin to the way
    * onMoveBegin on the Android side works.
    */
    setOnMoveBeginListener(listener, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                // adding the pan handler to the map oject so it's not GC'd
                theMap['mapOnMoveBeginHandler'] = MapPanHandlerImpl.initWithOwnerAndListenerForMap(new WeakRef(this), listener, theMap);
                // tell the panHandler that we're only interested in the first pan per pan gesture
                theMap['mapOnMoveBeginHandler'].setOnMoveBegin();
                // there's already a pan recognizer, so find it and attach a target action
                for (let i = 0; i < theMap.gestureRecognizers.count; i++) {
                    let recognizer = theMap.gestureRecognizers.objectAtIndex(i);
                    if (recognizer instanceof UIPanGestureRecognizer) {
                        recognizer.addTargetAction(theMap['mapOnMoveBeginHandler'], "pan");
                        break;
                    }
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setOnScrollListener: " + ex);
                reject(ex);
            }
        });
    }
    setOnFlingListener(listener, nativeMap) {
        // there's no swipe event we can bind to
        return Promise.reject("'setOnFlingListener' is not supported on iOS");
    }
    setOnCameraMoveListener(listener, nativeMap) {
        return Promise.reject("'setOnCameraMoveListener' not currently supported on iOS");
    }
    setOnCameraMoveCancelListener(listener, nativeMap) {
        return Promise.reject("'setOnCameraMoveCancelListener' not currently supported on iOS");
    }
    setOnCameraIdleListener(listener, nativeMap) {
        return Promise.reject("'setOnCameraIdleListener' not currently supported on iOS");
    }
    getViewport(nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                let visibleBounds = theMap.visibleCoordinateBounds;
                let bounds = {
                    north: visibleBounds.ne.latitude,
                    east: visibleBounds.ne.longitude,
                    south: visibleBounds.sw.latitude,
                    west: visibleBounds.sw.longitude
                };
                resolve({
                    bounds: bounds,
                    zoomLevel: theMap.zoomLevel
                });
            }
            catch (ex) {
                console.log("Error in mapbox.getViewport: " + ex);
                reject(ex);
            }
        });
    }
    setViewport(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                let bounds = {
                    sw: CLLocationCoordinate2DMake(options.bounds.south, options.bounds.west),
                    ne: CLLocationCoordinate2DMake(options.bounds.north, options.bounds.east)
                };
                let animated = options.animated === undefined || options.animated;
                // support defined padding
                let padding = Mapbox.merge(options.padding === undefined ? {} : options.padding, {
                    top: 25,
                    left: 25,
                    bottom: 25,
                    right: 25
                });
                theMap.setVisibleCoordinateBoundsEdgePaddingAnimated(bounds, padding, animated);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.setViewport: " + ex);
                reject(ex);
            }
        });
    }
    downloadOfflineRegion(options) {
        return new Promise((resolve, reject) => {
            try {
                let styleURL = _getMapStyle(options.style);
                let swCoordinate = CLLocationCoordinate2DMake(options.bounds.south, options.bounds.west);
                let neCoordinate = CLLocationCoordinate2DMake(options.bounds.north, options.bounds.east);
                let bounds = {
                    sw: swCoordinate,
                    ne: neCoordinate
                };
                let region = MGLTilePyramidOfflineRegion.alloc().initWithStyleURLBoundsFromZoomLevelToZoomLevel(styleURL, bounds, options.minZoom, options.maxZoom);
                if (options.accessToken) {
                    MGLAccountManager.accessToken = options.accessToken;
                }
                // TODO there's more observers, see https://www.mapbox.com/ios-sdk/examples/offline-pack/
                if (options.onProgress) {
                    _addObserver(MGLOfflinePackProgressChangedNotification, (notification) => {
                        let offlinePack = notification.object;
                        let offlinePackProgress = offlinePack.progress;
                        let userInfo = NSKeyedUnarchiver.unarchiveObjectWithData(offlinePack.context);
                        let complete = offlinePackProgress.countOfResourcesCompleted === offlinePackProgress.countOfResourcesExpected;
                        options.onProgress({
                            name: userInfo.objectForKey("name"),
                            completed: offlinePackProgress.countOfResourcesCompleted,
                            expected: offlinePackProgress.countOfResourcesExpected,
                            percentage: Math.round((offlinePackProgress.countOfResourcesCompleted / offlinePackProgress.countOfResourcesExpected) * 10000) / 100,
                            complete: complete
                        });
                        if (complete) {
                            resolve();
                        }
                    });
                }
                _addObserver(MGLOfflinePackErrorNotification, (notification) => {
                    let offlinePack = notification.object;
                    let userInfo = NSKeyedUnarchiver.unarchiveObjectWithData(offlinePack.context);
                    let error = notification.userInfo[MGLOfflinePackUserInfoKeyError];
                    reject({
                        name: userInfo.objectForKey("name"),
                        error: "Download error. " + error
                    });
                });
                _addObserver(MGLOfflinePackMaximumMapboxTilesReachedNotification, (notification) => {
                    let offlinePack = notification.object;
                    let userInfo = NSKeyedUnarchiver.unarchiveObjectWithData(offlinePack.context);
                    let maximumCount = notification.userInfo[MGLOfflinePackUserInfoKeyMaximumCount];
                    console.log(`Offline region '${userInfo.objectForKey("name")}' reached the tile limit of ${maximumCount}`);
                });
                // Store some data for identification purposes alongside the downloaded resources.
                let userInfo = { "name": options.name };
                let context = NSKeyedArchiver.archivedDataWithRootObject(userInfo);
                // Create and register an offline pack with the shared offline storage object.
                MGLOfflineStorage.sharedOfflineStorage.addPackForRegionWithContextCompletionHandler(region, context, (pack, error) => {
                    if (error) {
                        // The pack couldn’t be created for some reason.
                        reject(error.localizedFailureReason);
                    }
                    else {
                        // Start downloading.
                        pack.resume();
                    }
                });
            }
            catch (ex) {
                console.log("Error in mapbox.downloadOfflineRegion: " + ex);
                reject(ex);
            }
        });
    }
    listOfflineRegions(options) {
        return new Promise((resolve, reject) => {
            try {
                let packs = MGLOfflineStorage.sharedOfflineStorage.packs;
                if (!packs) {
                    reject("No packs found or Mapbox not ready yet");
                    return;
                }
                let regions = [];
                for (let i = 0; i < packs.count; i++) {
                    let pack = packs.objectAtIndex(i);
                    let region = pack.region;
                    let userInfo = NSKeyedUnarchiver.unarchiveObjectWithData(pack.context);
                    regions.push({
                        name: userInfo.objectForKey("name"),
                        style: "" + region.styleURL,
                        minZoom: region.minimumZoomLevel,
                        maxZoom: region.maximumZoomLevel,
                        bounds: {
                            north: region.bounds.ne.latitude,
                            east: region.bounds.ne.longitude,
                            south: region.bounds.sw.latitude,
                            west: region.bounds.sw.longitude
                        }
                    });
                }
                resolve(regions);
            }
            catch (ex) {
                console.log("Error in mapbox.listOfflineRegions: " + ex);
                reject(ex);
            }
        });
    }
    deleteOfflineRegion(options) {
        return new Promise((resolve, reject) => {
            try {
                if (!options || !options.name) {
                    reject("Pass in the 'name' param");
                    return;
                }
                let packs = MGLOfflineStorage.sharedOfflineStorage.packs;
                let found = false;
                for (let i = 0; i < packs.count; i++) {
                    let pack = packs.objectAtIndex(i);
                    let userInfo = NSKeyedUnarchiver.unarchiveObjectWithData(pack.context);
                    let name = userInfo.objectForKey("name");
                    if (name === options.name) {
                        found = true;
                        MGLOfflineStorage.sharedOfflineStorage.removePackWithCompletionHandler(pack, (error) => {
                            if (error) {
                                // The pack couldn’t be deleted for some reason.
                                reject(error.localizedFailureReason);
                            }
                            else {
                                resolve();
                                // don't return, see note below
                            }
                        });
                        // don't break the loop as there may be multiple packs with the same name
                    }
                }
                if (!found) {
                    reject("Region not found");
                }
            }
            catch (ex) {
                console.log("Error in mapbox.deleteOfflineRegion: " + ex);
                reject(ex);
            }
        });
    }
    addExtrusion(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.deleteOfflineRegion: " + ex);
                reject(ex);
            }
        });
    }
    // -------------------------------------------------------------------------------------
    /**
    * add a vector or geojson source
    *
    * Add a source that can then be referenced in the style specification
    * passed to addLayer().
    *
    * @link https://docs.mapbox.com/mapbox-gl-js/api/#map#addsource
    */
    addSource(id, options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                const { url, type } = options;
                let theMap = nativeMap || this._mapboxViewInstance;
                let source;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                if (theMap.style.sourceWithIdentifier(id)) {
                    reject("Source exists: " + id);
                    return;
                }
                switch (type) {
                    case "vector":
                        source = MGLVectorTileSource.alloc().initWithIdentifierConfigurationURL(id, NSURL.URLWithString(url));
                        break;
                    case 'geojson':
                        // has a source with this id already been defined? If so, then it is an error (because attempting
                        // to add another source with the same id will crash the app.
                        if (theMap.style.sourceWithIdentifier(id)) {
                            reject("Remove the layer with this id first with 'removeLayer': " + id);
                            return;
                        }
                        // under iOS we handle lines and circles differently
                        if (options.data.geometry.type == 'LineString') {
                            // after hours and hours of trial and error, I finally stumbled upon how to set things
                            // up so that MGLPolylineFeature.polylineWithCoordinatesCount works.
                            //
                            // Allocating an NSArray and passing it in would cause the app to crash.
                            // Creating a javascript array of CLLocationCoodinate2D entries would cause random
                            // lines to be drawn on the map.
                            //
                            // However, allocating a raw C buffer and accessing it through a reference cast to CLLocationCoordinate2D
                            // works (to my shock and horror).
                            let coordinates = options.data.geometry.coordinates;
                            let buffer = malloc(coordinates.length * 2 * interop.sizeof(interop.types.double));
                            let clCoordsArray = new interop.Reference(CLLocationCoordinate2D, buffer);
                            // We need to convert our coordinate array into an array of CLLocationCoodinate2D elements
                            // which are in lat/lng order and not lng/lat
                            for (let i = 0; i < coordinates.length; i++) {
                                let newCoord = CLLocationCoordinate2DMake(coordinates[i][1], coordinates[i][0]);
                                clCoordsArray[i] = newCoord;
                            }
                            console.log("Mapbox:addSource(): after CLLocationCoordinate2D array before creating polyline source from clCoordsArray");
                            let polyline = MGLPolylineFeature.polylineWithCoordinatesCount(new interop.Reference(CLLocationCoordinate2D, clCoordsArray), coordinates.length);
                            source = MGLShapeSource.alloc().initWithIdentifierShapeOptions(id, polyline, null);
                            theMap.style.addSource(source);
                            // To support handling click events on lines and circles, we keep the underlying
                            // feature.
                            //
                            // FIXME: There should be a way to get the original feature back out from the source
                            // but I have not yet figured out how.
                            this.lines.push({
                                type: 'line',
                                id: id,
                                clCoordsArray: clCoordsArray,
                                numCoords: coordinates.length,
                                source: source
                            });
                        }
                        else if (options.data.geometry.type == 'Point') {
                            // FIXME: should be able to just call addSource here for type geoJson
                            console.log("Mapbox:addSource(): before addSource with options:", options);
                            const geoJSON = `{"type": "FeatureCollection", "features": [ ${JSON.stringify(options.data)}]}`;
                            // this would otherwise crash the app
                            if (theMap.style.sourceWithIdentifier(id)) {
                                reject("Remove the layer with this id first with 'removeLayer': " + id);
                                return;
                            }
                            console.log("Mapbox:addSource(): after checking for existing style");
                            const geoDataStr = NSString.stringWithString(geoJSON);
                            console.log("Mapbox:addSource(): after string");
                            const geoData = geoDataStr.dataUsingEncoding(NSUTF8StringEncoding);
                            console.log("Mapbox:addSource(): after encoding");
                            const geoDataBase64Enc = geoData.base64EncodedStringWithOptions(0);
                            console.log("Mapbox:addSource(): before alloc");
                            const geo = NSData.alloc().initWithBase64EncodedStringOptions(geoDataBase64Enc, null);
                            console.log("Mapbox:addSource(): before shape with id '" + id + "'");
                            const shape = MGLShape.shapeWithDataEncodingError(geo, NSUTF8StringEncoding);
                            console.log("Mapbox:addSource(): after shape before second alloc with id '" + id + "' and shape '" + shape + "'");
                            const source = MGLShapeSource.alloc().initWithIdentifierShapeOptions(id, shape, null);
                            console.log("Mapbox:addSource(): before addSource");
                            theMap.style.addSource(source);
                            // probably a circle
                            this.circles.push({
                                type: 'line',
                                id: id,
                                center: options.data.geometry.coordinates
                            });
                        }
                        break;
                    default:
                        reject("Invalid source type: " + type);
                        return;
                }
                if (!source) {
                    const ex = "No source to add";
                    console.log("Error in mapbox.addSource: " + ex);
                    reject(ex);
                    return;
                }
                theMap.style.addSource(source);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.addSource: " + ex);
                reject(ex);
            }
        });
    }
    // -------------------------------------------------------------------------------------
    /**
    * remove a vector source by id
    */
    removeSource(id, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                const source = theMap.style.sourceWithIdentifier(id);
                if (!source) {
                    reject("Source does not exist");
                    return;
                }
                theMap.style.removeSource(source);
                // if we've cached the underlying feature, remove it.
                //
                // since we don't know if it's a line or a circle we have to check both lists.
                let offset = this.lines.findIndex((entry) => { return entry.id == id; });
                if (offset != -1) {
                    this.lines.splice(offset, 1);
                }
                offset = this.circles.findIndex((entry) => { return entry.id == id; });
                if (offset != -1) {
                    this.circles.splice(offset, 1);
                }
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.removeSource: " + ex);
                reject(ex);
            }
        });
    }
    // -------------------------------------------------------------------------------------
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
    addLayer(style, nativeMapView) {
        let retval;
        switch (style.type) {
            case 'line':
                retval = this.addLineLayer(style, nativeMapView);
                break;
            case 'circle':
                retval = this.addCircleLayer(style, nativeMapView);
                break;
            default:
                retval = Promise.reject("Mapbox:addLayer() Unsupported geometry type '" + style.type + "'");
                break;
        }
        return retval;
    }
    // --------------------------------------------------------------
    /**
    * remove layer by ID
    *
    * Removes a layer given a layer id
    *
    * @param {string} id
    */
    removeLayer(id, nativeMapViewInstance) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMapViewInstance || this._mapboxViewInstance;
                console.log("Mapbox::removeLayer(): attempting to remove layer '" + id + "'");
                let layer = theMap.style.layerWithIdentifier(id);
                console.log("Mapbox:removeLayer(): got layer object: ", layer);
                if (!layer) {
                    throw new Error("Layer '" + id + "' not found when attempting to remove it.");
                }
                theMap.style.removeLayer(layer);
                console.log("Mapbox:removeLayer(): after removing layer " + id);
                resolve();
            }
            catch (ex) {
                console.log("Mapbox:removeLayer() Error : " + ex);
                reject(ex);
            }
        }); // end of Promise()
    } // end of removeLayer()
    // -------------------------------------------------------------------------------------
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
    addLineLayer(style, nativeMapViewInstance) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMapViewInstance || this._mapboxViewInstance;
                if (style.type != 'line') {
                    reject("Non line style passed to addLineLayer()");
                }
                // the source may be of type geojson or it may be the id of a source added by addSource().
                let sourceId = null;
                if (typeof style.source != 'string') {
                    sourceId = style.id + '_source';
                    this.addSource(sourceId, style.source);
                }
                else {
                    sourceId = style.source;
                }
                const layer = MGLLineStyleLayer.alloc().initWithIdentifierSource(style.id, theMap.style.sourceWithIdentifier(sourceId));
                // color
                let color = 'black';
                if (style.paint && style.paint['line-color']) {
                    color = style.paint['line-color'];
                }
                layer.lineColor = NSExpression.expressionForConstantValue(new Color(color).ios);
                console.log("Mapbox:addLineLayer(): after line color");
                // line width
                let width = 5;
                if (style.paint && style.paint['line-width']) {
                    width = style.paint['line-width'];
                }
                layer.lineWidth = NSExpression.expressionForConstantValue(width);
                console.log("Mapbox:addLineLayer(): after line width");
                let opacity = 1;
                if (style.paint && style.paint['line-opacity']) {
                    opacity = style.paint['line-opacity'];
                }
                layer.lineOpacity = NSExpression.expressionForConstantValue(opacity);
                console.log("Mapbox:addLineLayer(): after opacity");
                // line dash array
                if (style.paint && style.paint['line-dash-array']) {
                    let dashArray = [];
                    for (let i = 0; i < style.paint['line-dash-array'].length; i++) {
                        dashArray[i] = NSExpression.expressionForConstantValue(style.paint['line-dash-array'][i]);
                    }
                    layer.lineDashPattern = NSExpression.expressionForConstantValue(dashArray);
                }
                theMap.style.addLayer(layer);
                console.log("Mapbox:addLineLayer(): after adding layer.");
                let lineEntry = this.lines.find((entry) => { return entry.id == sourceId; });
                if (lineEntry) {
                    lineEntry.layer = layer;
                }
                console.log("Mapbox:addLineLayer(): pushed line:", this.lines[this.lines.length - 1]);
                resolve();
            }
            catch (ex) {
                console.log("Mapbox:addLineLayer() Error : " + ex);
                reject(ex);
            }
        }); // end of Promise()
    } // end of addLineLayer
    // -------------------------------------------------------------------------------------
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
    addLinePoint(id, lnglat, nativeMapView) {
        return new Promise((resolve, reject) => {
            try {
                // The original thought was to query the source to get the points that make up the line
                // and then add a point to it. Unfortunately, it seems that the points in the source
                // are modified and do not match the original set of points that make up the map. I kept
                // adding a LineString and after querying it it would be returned as a MultiLineString
                // with more points.
                //
                // As a result of this, we keep the original feature in the lines list and use that
                // as the data source for the line. As each point is added, we append it to the
                // feature and reset the json source for the displayed line.
                let lineEntry = this.lines.find((entry) => { return entry.id == id; });
                if (!lineEntry) {
                    reject("No such line layer '" + id + "'");
                    return;
                }
                // we carry a pointer to the raw buffer of CLLocationCoordinate2D structures.
                // since we are managing the buffer ourselves we need to allocate space for
                // the new location entry.
                //
                // I originally tried realloc here but as soon as I try to add an entry an exception is thrown
                // indicating it's a read only property; hence the alloc, copy, and free here.
                let bytes = lineEntry.numCoords * 2 * interop.sizeof(interop.types.double);
                let buffer = malloc(bytes + (2 * interop.sizeof(interop.types.double)));
                let newCoordsArray = new interop.Reference(CLLocationCoordinate2D, buffer);
                for (let i = 0; i < lineEntry.numCoords; i++) {
                    newCoordsArray[i] = lineEntry.clCoordsArray[i];
                }
                lineEntry.numCoords++;
                newCoordsArray[lineEntry.numCoords - 1] = CLLocationCoordinate2DMake(lnglat[1], lnglat[0]);
                free(lineEntry.clCoordsArray);
                let polyline = MGLPolylineFeature.polylineWithCoordinatesCount(new interop.Reference(CLLocationCoordinate2D, newCoordsArray), lineEntry.numCoords);
                lineEntry.clCoordsArray = newCoordsArray;
                // now update the source
                lineEntry.source.shape = polyline;
                resolve();
            }
            catch (ex) {
                console.log("Mapbox:addLinePoint() Error : " + ex);
                reject(ex);
            }
        });
    } // end of addLinePoint()
    // -------------------------------------------------------------------------------------
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
    addCircleLayer(style, nativeMapViewInstance) {
        return new Promise((resolve, reject) => {
            try {
                const theMap = nativeMapViewInstance || this._mapboxViewInstance;
                if (style.type != 'circle') {
                    reject("Non circle style passed to addCircleLayer()");
                }
                if (typeof style.source != 'undefined') {
                    reject("Missing source.");
                }
                // the source may be of type geojson, vector,  or it may be the id of a source added by addSource().
                let sourceId = null;
                if (typeof style.source != 'string') {
                    sourceId = style.id + '_source';
                    this.addSource(sourceId, style.source);
                }
                else {
                    sourceId = style.source;
                }
                console.log("Mapbox:addCircleLayer(): after adding source");
                const layer = MGLCircleStyleLayer.alloc().initWithIdentifierSource(style.id, theMap.style.sourceWithIdentifier(sourceId));
                // color
                let color = 'black';
                if (style.paint && style.paint['circle-color']) {
                    color = style.paint['circle-color'];
                }
                layer.circleColor = NSExpression.expressionForConstantValue(new Color(color).ios);
                console.log("Mapbox:addCircleLayer(): after circle color");
                // stroke color
                let strokeColor = 'black';
                if (style.paint && style.paint['circle-stroke-color']) {
                    strokeColor = style.paint['circle-stroke-color'];
                }
                layer.circleStrokeColor = NSExpression.expressionForConstantValue(new Color(strokeColor).ios);
                // stroke width
                let width = 5;
                if (style.paint && style.paint['circle-stroke-width']) {
                    width = style.paint['circle-stroke-width'];
                }
                layer.circleStrokeWidth = NSExpression.expressionForConstantValue(width);
                console.log("Mapbox:addCircleLayer(): after stroke width");
                let opacity = 1;
                if (style.paint && style.paint['circle-opacity']) {
                    opacity = style.paint['circe-opacity'];
                }
                layer.circleOpacity = NSExpression.expressionForConstantValue(opacity);
                console.log("Mapbox:addCircleLayer(): after opacity");
                // we have two options for a radius. We might have a fixed float or an expression
                let radius = 15;
                if (style.paint && typeof style.paint['circle-radius'] == 'number') {
                    layer.circleRadius = NSExpression.expressionForConstantValue(style.paint['circle-radius']);
                }
                else {
                    if (!style.paint['circle-radius'].stops) {
                        reject("No radius or stops provided to addCircleLayer.");
                        return;
                    }
                    // for the moment we assume we have a set of stops and a base.
                    let stopKeys = [];
                    let stopValues = [];
                    console.log("Mapbox:addCircleLayer(): adding '" + style.paint['circle-radius'].stops.length + "' stops");
                    // this took forever to figure out. There is some NativeScript bug and the type definition for
                    // NSExpression is not clear. We have to create an NSDictionary with two arrays. The first array is the
                    // values and the second one is the keys. They have to be in ascending order. Once an NSDictionary is created
                    // we have to create an NSArray with that.
                    for (let i = 0; i < style.paint['circle-radius'].stops.length; i++) {
                        stopKeys[i] = style.paint['circle-radius'].stops[i][0];
                        stopValues[i] = style.paint['circle-radius'].stops[i][1];
                    }
                    let base = 2;
                    if (style.paint['circle-radius'].stops.base) {
                        base = style.paint['circle-radius'].stops.base;
                    }
                    console.log("Mapbox:addCircleLayer(): pushing circleRadius with base:", base);
                    let nsDict = new NSDictionary(stopValues, stopKeys);
                    let nsArray = NSArray.arrayWithArray([nsDict]);
                    layer.circleRadius = NSExpression.expressionWithFormatArgumentArray("mgl_interpolate:withCurveType:parameters:stops:( $zoomLevel, 'exponential', 2, %@)", nsArray);
                    console.log("Mapbox:addCircleLayer(): after setting circle radius expression");
                }
                theMap.style.addLayer(layer);
                let circleEntry = this.circles.find((entry) => { return entry.id == sourceId; });
                if (circleEntry) {
                    circleEntry.radius = style['circle-radius'],
                        circleEntry.layer = layer;
                }
                resolve();
            }
            catch (ex) {
                console.log("Mapbox:addCircleLayer() Error : " + ex);
                reject(ex);
            }
        }); // end of Promise()
    } // end of addCircleLayer()
    // ---------------------------------------------------------------------
    addGeoJsonClustered(options, nativeMap) {
        throw new Error('Method not implemented.');
    }
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
    trackUser(options, nativeMap) {
        return new Promise((resolve, reject) => {
            try {
                let theMap = nativeMap || this._mapboxViewInstance;
                if (!theMap) {
                    reject("No map has been loaded");
                    return;
                }
                if (!theMap.showsUserLocation) {
                    reject("The map is not currently showing the user location");
                    return;
                }
                theMap.setUserTrackingModeAnimated(_getTrackingMode(options.mode), options.animated !== false);
                resolve();
            }
            catch (ex) {
                console.log("Error in mapbox.trackUser: " + ex);
                reject(ex);
            }
        });
    }
}
const _addObserver = (eventName, callback) => {
    return NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(eventName, null, NSOperationQueue.mainQueue, callback);
};
const _downloadImage = marker => {
    return new Promise((resolve, reject) => {
        console.log(">> _downloadImage");
        // to cache..
        if (_markerIconDownloadCache[marker.icon]) {
            marker.iconDownloaded = _markerIconDownloadCache[marker.icon];
            console.log(">> marker.iconDownloaded: " + marker.iconDownloaded);
            resolve(marker);
            return;
        }
        // ..or not to cache
        http.getImage(marker.icon).then((output) => {
            marker.iconDownloaded = output.ios;
            _markerIconDownloadCache[marker.icon] = marker.iconDownloaded;
            resolve(marker);
        }, (ignoredError) => {
            console.log(`Download failed for ${marker.icon} with error: ${ignoredError}`);
            resolve(marker);
        });
    });
};
const _downloadMarkerImages = (markers) => {
    let iterations = [];
    let result = [];
    markers.forEach(marker => {
        if (marker.icon && marker.icon.startsWith("http")) {
            let p = _downloadImage(marker).then(mark => result.push(mark));
            iterations.push(p);
        }
        else {
            result.push(marker);
        }
    });
    return Promise.all(iterations).then(() => result);
};
const _addMarkers = (markers, nativeMap) => {
    if (!markers) {
        console.log("No markers passed");
        return;
    }
    if (!Array.isArray(markers)) {
        console.log("markers must be passed as an Array: [{title: 'foo'}]");
        return;
    }
    let theMap = nativeMap || this._mapboxViewInstance;
    _downloadMarkerImages(markers).then((updatedMarkers) => {
        updatedMarkers.forEach(marker => {
            let lat = marker.lat;
            let lng = marker.lng;
            let point = MGLPointAnnotation.new();
            point.coordinate = CLLocationCoordinate2DMake(lat, lng);
            point.title = marker.title;
            point.subtitle = marker.subtitle;
            // needs to be done before adding to the map, otherwise the delegate method 'mapViewImageForAnnotation' can't use it
            _markers.push(marker);
            theMap.addAnnotation(point);
            if (marker.selected) {
                theMap.selectAnnotationAnimated(point, false);
            }
            marker.ios = point;
            marker.update = (newSettings) => {
                _markers.forEach(_marker => {
                    if (marker.id === _marker.id) {
                        if (newSettings.onTap !== undefined) {
                            _marker.onTap = newSettings.onTap;
                        }
                        if (newSettings.onCalloutTap !== undefined) {
                            _marker.onCalloutTap = newSettings.onCalloutTap;
                        }
                        if (newSettings.title !== undefined) {
                            _marker.ios.title = _marker.title = newSettings.title;
                        }
                        if (newSettings.subtitle !== undefined) {
                            _marker.ios.subtitle = _marker.subtitle = newSettings.subtitle;
                        }
                        if (newSettings.lat && newSettings.lng) {
                            _marker.lat = newSettings.lat;
                            _marker.lng = newSettings.lng;
                            _marker.ios.coordinate = CLLocationCoordinate2DMake(newSettings.lat, newSettings.lng);
                        }
                        if (newSettings.selected) {
                            theMap.selectAnnotationAnimated(_marker.ios, false);
                        }
                    }
                });
            };
        });
    });
};
var MGLMapViewDelegateImpl = /** @class */ (function (_super) {
    __extends(MGLMapViewDelegateImpl, _super);
    function MGLMapViewDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MGLMapViewDelegateImpl.new = function () {
        return _super.new.call(this);
    };
    // -----------------------
    /**
    * initialize with the mapReady callback
    */
    MGLMapViewDelegateImpl.prototype.initWithCallback = function (mapLoadedCallback) {
        console.log("MGLMapViewDelegateImpl::initWithCallback()");
        this.mapLoadedCallback = mapLoadedCallback;
        return this;
    };
    // -----------------------
    /**
    * set a reference to the mapboxAPI instance
    */
    MGLMapViewDelegateImpl.prototype.setMapboxApi = function (api) {
        this.mapboxApi = api;
    };
    // -----------------------
    /**
    * set the user location click listener callback
    */
    MGLMapViewDelegateImpl.prototype.setUserLocationClickListener = function (callback) {
        this.userLocationClickListener = callback;
    };
    // -----------------------
    /**
    * set user location marker modes
    */
    MGLMapViewDelegateImpl.prototype.changeUserLocationRenderMode = function (userLocationRenderMode) {
        this.userLocationAnnotationView.changeUserLocationRenderMode(userLocationRenderMode);
    };
    // -----------------------
    /**
    * set style loaded callback.
    *
    * set an optional callback to be invoked when a style set with
    * setMapStyle() is finished loading
    *
    * @param {function} callback function with loaded style as parameter.
    *
    * @see Mapbox:setMapStyle()
    */
    MGLMapViewDelegateImpl.prototype.setStyleLoadedCallback = function (callback) {
        this.styleLoadedCallback = callback;
    };
    // -----------------------
    /**
    * map ready callback
    */
    MGLMapViewDelegateImpl.prototype.mapViewDidFinishLoadingMap = function (mapView) {
        console.log("MGLMapViewDelegateImpl:mapViewDidFinishLoadingMap(): top");
        if (this.mapLoadedCallback !== undefined) {
            this.mapLoadedCallback(mapView);
            // this should be fired only once, but it's also fired when the style changes, so just remove the callback
            this.mapLoadedCallback = undefined;
        }
    };
    // ------------------------
    MGLMapViewDelegateImpl.prototype.mapViewDidFinishRenderingMapFullyRendered = function (mapView, fullyRendered) {
        console.log("MGLMapViewDelegateImpl:mapViewDidFinishRenderingMapFullyRendered(): rendered is:", fullyRendered);
    };
    // ------------------------
    /**
    * Callback when the style has been loaded.
    *
    * Based on my testing, it looks like this callback is invoked multiple times.
    *
    * @see Mapbox:setMapStyle()
    *
    * @link https://mapbox.github.io/mapbox-gl-native/macos/0.3.0/Protocols/MGLMapViewDelegate.html#/c:objc(pl)MGLMapViewDelegate(im)mapView:didFinishLoadingStyle:
    */
    MGLMapViewDelegateImpl.prototype.mapViewDidFinishLoadingStyle = function (mapView) {
        console.log("MGLMapViewDelegateImpl:mapViewDidFinishLoadingStyle(): callback called.");
        if (this.styleLoadedCallback !== undefined) {
            this.styleLoadedCallback(mapView);
            // to avoid multiple calls. This is only invoked from setMapStyle().
            this.styleLoadedCallback = undefined;
        }
    };
    // ------------------------
    /**
    * disable the default user location callout
    *
    * This took forever to find. The default iOS click handler for the user location
    * marker is about useless. It just displays "You Are Here". The examples do not
    * show how to disable it.
    */
    MGLMapViewDelegateImpl.prototype.mapViewAnnotationCanShowCallout = function (mapView, annotation) {
        if (annotation.isKindOfClass(MGLUserLocation.class())) {
            return false;
        }
        else {
            return true;
        }
    };
    // -------------------------
    MGLMapViewDelegateImpl.prototype.mapViewDidFailLoadingMapWithError = function (mapView, error) {
        // console.log("mapViewDidFailLoadingMapWithError: " + error);
    };
    // ---------------------------------------
    MGLMapViewDelegateImpl.prototype.mapViewDidChangeUserTrackingModeAnimated = function (mapView, mode, animated) {
        // console.log("mapViewDidChangeUserTrackingModeAnimated: " + mode);
    };
    // ----------------------------------------
    /**
    * fired when the marker icon is about to be rendered - return null for the default icon
    */
    MGLMapViewDelegateImpl.prototype.mapViewImageForAnnotation = function (mapView, annotation) {
        var cachedMarker = this.getTappedMarkerDetails(annotation);
        if (cachedMarker) {
            if (cachedMarker.reuseIdentifier) {
                var reusedImage = mapView.dequeueReusableAnnotationImageWithIdentifier(cachedMarker.reuseIdentifier);
                if (reusedImage) {
                    return reusedImage;
                }
            }
            // TODO try adding .rotatesToMatchCamera = true;
            // .. for instance in the mapViewDidDeselectAnnotationView / mapViewDidSelectAnnotationView / mapViewViewForAnnotation delegate
            if (cachedMarker.icon) {
                if (cachedMarker.icon.startsWith("res://")) {
                    var resourceName = cachedMarker.icon.substring("res://".length);
                    var imageSource = imgSrc.fromResource(resourceName);
                    if (imageSource === null) {
                        console.log("Unable to locate " + resourceName);
                    }
                    else {
                        cachedMarker.reuseIdentifier = cachedMarker.icon;
                        return MGLAnnotationImage.annotationImageWithImageReuseIdentifier(imageSource.ios, cachedMarker.reuseIdentifier);
                    }
                }
                else if (cachedMarker.icon.startsWith("http")) {
                    if (cachedMarker.iconDownloaded !== null) {
                        cachedMarker.reuseIdentifier = cachedMarker.icon;
                        return MGLAnnotationImage.annotationImageWithImageReuseIdentifier(cachedMarker.iconDownloaded, cachedMarker.reuseIdentifier);
                    }
                }
                else {
                    console.log("Please use res://resourceName, http(s)://imageUrl or iconPath to use a local path");
                }
            }
            else if (cachedMarker.iconPath) {
                var appPath = fs.knownFolders.currentApp().path;
                var iconFullPath = appPath + "/" + cachedMarker.iconPath;
                if (fs.File.exists(iconFullPath)) {
                    var image = imgSrc.fromFile(iconFullPath).ios;
                    // perhaps add resize options for nice retina rendering (although you can now use the 'icon' param instead)
                    cachedMarker.reuseIdentifier = cachedMarker.iconPath;
                    return MGLAnnotationImage.annotationImageWithImageReuseIdentifier(image, cachedMarker.reuseIdentifier);
                }
            }
        }
        return null;
    };
    // ---------------------------------------------
    /**
    * fired when one of the callout's accessoryviews is tapped (not currently used)
    */
    MGLMapViewDelegateImpl.prototype.mapViewAnnotationCalloutAccessoryControlTapped = function (mapView, annotation, control) {
    };
    // --------------------------------------------
    /**
    * fired when a marker is tapped
    */
    MGLMapViewDelegateImpl.prototype.mapViewDidSelectAnnotation = function (mapView, annotation) {
        console.log("MGLMapViewDelegateImpl::mapViewDidSelectAnntation()");
        if (annotation.isKindOfClass(MGLUserLocation.class())) {
            console.log("MGLMapViewDelegateImpl::mapViewDidSelectAnnotation(): tapped the user location button");
            if (typeof this.userLocationClickListener != 'undefined') {
                this.userLocationClickListener(annotation);
                return;
            }
            mapView.deselectAnnotationAnimated(annotation, false);
        }
        var cachedMarker = this.getTappedMarkerDetails(annotation);
        if (cachedMarker && cachedMarker.onTap) {
            cachedMarker.onTap(cachedMarker);
        }
    };
    // ----------------------------------------------------------------------------------
    /**
    * fired when a callout is tapped
    */
    MGLMapViewDelegateImpl.prototype.mapViewTapOnCalloutForAnnotation = function (mapView, annotation) {
        var cachedMarker = this.getTappedMarkerDetails(annotation);
        if (cachedMarker && cachedMarker.onCalloutTap) {
            cachedMarker.onCalloutTap(cachedMarker);
        }
    };
    // -----------------------------------------------------------------------------------
    MGLMapViewDelegateImpl.prototype.getTappedMarkerDetails = function (tapped) {
        for (var m in _markers) {
            var cached = _markers[m];
            // don't compare lat/lng types as they're not the same (same for (sub)title, they may be null vs undefined)
            // tslint:disable-next-line:triple-equals
            if (cached.lat == tapped.coordinate.latitude &&
                // tslint:disable-next-line:triple-equals
                cached.lng == tapped.coordinate.longitude &&
                // tslint:disable-next-line:triple-equals
                cached.title == tapped.title &&
                // tslint:disable-next-line:triple-equals
                cached.subtitle == tapped.subtitle) {
                return cached;
            }
        }
    };
    // ------------------------------------------------------------------------------------
    /**
    * override the standard location marker
    */
    MGLMapViewDelegateImpl.prototype.mapViewViewForAnnotation = function (mapView, annotation) {
        console.log("MGLMapViewDelegateImpl::mapViewViewForAnnotation() top");
        if (annotation.isKindOfClass(MGLUserLocation.class())) {
            this.userLocationAnnotationView = CustomUserLocationAnnotationView.alloc().init();
            return this.userLocationAnnotationView;
        }
        return null;
    };
    MGLMapViewDelegateImpl.ObjCProtocols = [MGLMapViewDelegate];
    return MGLMapViewDelegateImpl;
}(NSObject));
var MapTapHandlerImpl = /** @class */ (function (_super) {
    __extends(MapTapHandlerImpl, _super);
    function MapTapHandlerImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapTapHandlerImpl.initWithOwnerAndListenerForMap = function (owner, listener, mapView) {
        var handler = MapTapHandlerImpl.new();
        handler._owner = owner;
        handler._listener = listener;
        handler._mapView = mapView;
        return handler;
    };
    MapTapHandlerImpl.prototype.tap = function (recognizer) {
        var tapPoint = recognizer.locationInView(this._mapView);
        var tapCoordinate = this._mapView.convertPointToCoordinateFromView(tapPoint, this._mapView);
        this._listener({
            lat: tapCoordinate.latitude,
            lng: tapCoordinate.longitude
        });
    };
    MapTapHandlerImpl.ObjCExposedMethods = {
        "tap": { returns: interop.types.void, params: [interop.types.id] }
    };
    return MapTapHandlerImpl;
}(NSObject));
var MapLongPressHandlerImpl = /** @class */ (function (_super) {
    __extends(MapLongPressHandlerImpl, _super);
    function MapLongPressHandlerImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapLongPressHandlerImpl.initWithOwnerAndListenerForMap = function (owner, listener, mapView) {
        var handler = MapLongPressHandlerImpl.new();
        handler._owner = owner;
        handler._listener = listener;
        handler._mapView = mapView;
        return handler;
    };
    MapLongPressHandlerImpl.prototype.longPress = function (recognizer) {
        var longPressPoint = recognizer.locationInView(this._mapView);
        var longPressCoordinate = this._mapView.convertPointToCoordinateFromView(longPressPoint, this._mapView);
        this._listener({
            lat: longPressCoordinate.latitude,
            lng: longPressCoordinate.longitude
        });
    };
    MapLongPressHandlerImpl.ObjCExposedMethods = {
        "longPress": { returns: interop.types.void, params: [interop.types.id] }
    };
    return MapLongPressHandlerImpl;
}(NSObject));
var MapPanHandlerImpl = /** @class */ (function (_super) {
    __extends(MapPanHandlerImpl, _super);
    function MapPanHandlerImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapPanHandlerImpl.initWithOwnerAndListenerForMap = function (owner, listener, mapView) {
        var handler = MapPanHandlerImpl.new();
        handler._owner = owner;
        handler._listener = listener;
        handler._mapView = mapView;
        handler.onMoveBegin = false;
        return handler;
    };
    MapPanHandlerImpl.prototype.setOnMoveBegin = function () {
        this.onMoveBegin = true;
    };
    MapPanHandlerImpl.prototype.pan = function (recognizer) {
        var panPoint = recognizer.locationInView(this._mapView);
        var panCoordinate = this._mapView.convertPointToCoordinateFromView(panPoint, this._mapView);
        console.log("MapPanHandlerImpl::pan(): top with state:", recognizer.state);
        // if this is the beginning of the pan simulate the Android onMoveBegin
        //
        // See the objc platform declarations in objc!UIKit.d.ts. It doesn't quite match the apple documention
        if (this.onMoveBegin) {
            if (recognizer.state == UIGestureRecognizerState.Began) {
                console.log("MapPanHandlerImpl::pan(): calling onMoveBegin listener");
                this._listener({
                    lat: panCoordinate.latitude,
                    lng: panCoordinate.longitude
                });
            }
            return;
        }
        this._listener({
            lat: panCoordinate.latitude,
            lng: panCoordinate.longitude
        });
    };
    MapPanHandlerImpl.ObjCExposedMethods = {
        "pan": { returns: interop.types.void, params: [interop.types.id] }
    };
    return MapPanHandlerImpl;
}(NSObject));
var MapSwipeHandlerImpl = /** @class */ (function (_super) {
    __extends(MapSwipeHandlerImpl, _super);
    function MapSwipeHandlerImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapSwipeHandlerImpl.initWithOwnerAndListenerForMap = function (owner, listener, mapView) {
        var handler = MapSwipeHandlerImpl.new();
        handler._owner = owner;
        handler._listener = listener;
        handler._mapView = mapView;
        return handler;
    };
    MapSwipeHandlerImpl.prototype.swipe = function (recognizer) {
        var swipePoint = recognizer.locationInView(this._mapView);
        var swipeCoordinate = this._mapView.convertPointToCoordinateFromView(swipePoint, this._mapView);
        this._listener({
            lat: swipeCoordinate.latitude,
            lng: swipeCoordinate.longitude
        });
    };
    MapSwipeHandlerImpl.ObjCExposedMethods = {
        "swipe": { returns: interop.types.void, params: [interop.types.id] }
    };
    return MapSwipeHandlerImpl;
}(NSObject));
