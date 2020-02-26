<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout :rows="step.hasHeading ? '75,*,140' : '*,140'">
            <!-- header section -->
            <GridLayout
                row="0"
                rows="auto"
                columns="15*,70*,15*"
                class="m-y-20"
                v-if="step.hasHeading"
            >
                <StackLayout
                    col="0"
                    class="round-bkgd"
                    verticalAlignment="top"
                    @tap="goBack"
                >
                    <Image width="21" src="~/images/Icon_Backarrow.png" />
                </StackLayout>
                <StackLayout col="1" verticalAlignment="middle">
                    <Label
                        class="title text-center"
                        :text="step.title"
                        textWrap="true"
                    ></Label>
                </StackLayout>
                <StackLayout col="2" />
            </GridLayout>
            <!-- end header section -->

            <ScrollView :row="step.hasHeading ? 1 : 0 ">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <!-- connection steps -->
                    <StackLayout row="0" v-if="step.hasHeading">
                        <Label
                            v-for="instruction in step.instructions"
                            :key="instruction"
                            class="instruction"
                            :text="instruction"
                            lineHeight="4"
                            textWrap="true"
                        ></Label>
                        <GridLayout rows="*" columns="*">
                            <Image
                                width="75%"
                                verticalAlignment="middle"
                                v-if="displayFrame"
                                :src="displayFrame"
                            ></Image>
                        </GridLayout>
                    </StackLayout>
                    <!-- end connection steps section -->

                    <!-- other screens -->
                    <StackLayout row="0" v-if="!step.hasHeading" verticalAlignment="middle">
                        <GridLayout rows="*" columns="*">
                            <StackLayout row="0" verticalAlignment="middle">
                                <Image
                                    width="60"
                                    class="m-b-20"
                                    src="~/images/Icon_Soft_error.png"
                                    v-show="hasError"
                                />
                                <Label
                                    class="title m-t-20 m-b-10 text-center"
                                    :text="subtitle"
                                    textWrap="true"
                                ></Label>

                                <!-- calibration progress image -->
                                <GridLayout
                                    v-if="step.progressImage"
                                    rows="auto, auto"
                                    columns="*,*"
                                    width="80%"
                                    class="m-t-10 m-b-20"
                                >
                                    <Image
                                        row="0"
                                        colSpan="2"
                                        class="m-b-10 m-l-15 m-r-15"
                                        :src="step.progressImage"
                                    />
                                    <Label
                                        row="1"
                                        col="0"
                                        horizontalAlignment="left"
                                        text="Connect"
                                    />
                                    <Label
                                        row="1"
                                        col="1"
                                        horizontalAlignment="right"
                                        text="Set Up"
                                    />
                                </GridLayout>
                                <!-- end calibration progress image -->

                                <Label
                                    v-for="instruction in step.instructions"
                                    :key="instruction"
                                    class="instruction"
                                    :text="instruction"
                                    lineHeight="4"
                                    textWrap="true"
                                ></Label>

                                <!-- form for various input -->
                                <StackLayout v-if="hasForm">
                                    <ConnectStationForm
                                        :station="station"
                                        :step="step"
                                        ref="connectStationForm"
                                    />
                                </StackLayout>
                                <!-- end form -->

                                <!-- radio buttons and info -->
                                <GridLayout
                                    rows="auto,auto"
                                    columns="30,*"
                                    v-for="option in step.options"
                                    class="option-container"
                                >
                                    <check-box
                                        row="0"
                                        col="0"
                                        :checked="option.selected"
                                        :isEnabled="!option.selected"
                                        fillColor="#2C3E50"
                                        onCheckColor="#2C3E50"
                                        onTintColor="#2C3E50"
                                        fontSize="18"
                                        boxType="circle"
                                        @checkedChange="$event.value !== option.selected && toggleChoice(option)"
                                    />
                                    <Label
                                        row="0"
                                        col="1"
                                        class="m-t-5 m-l-5"
                                        :text="option.text"
                                    ></Label>
                                    <Label
                                        row="1"
                                        colSpan="2"
                                        class="radio-info size-15"
                                        lineHeight="4"
                                        :text="option.info"
                                        textWrap="true"
                                    ></Label>
                                </GridLayout>
                                <!-- end radio buttons -->

                                <!-- stations list -->
                                <template v-if="showingStations">
                                    <StackLayout class="m-t-10"></StackLayout>
                                    <GridLayout
                                        rows="auto"
                                        columns="30,*"
                                        class="option-container"
                                        v-for="s in stationOptions"
                                        :key="s.id"
                                    >
                                        <check-box
                                            col="0"
                                            :checked="s.selected"
                                            :isEnabled="!s.selected"
                                            fillColor="#2C3E50"
                                            onCheckColor="#2C3E50"
                                            onTintColor="#2C3E50"
                                            fontSize="18"
                                            boxType="circle"
                                            @checkedChange="$event.value !== s.selected && toggleStation(s)"
                                        />
                                        <Label
                                            col="1"
                                            class="m-t-5 m-l-5"
                                            :text="s.name"
                                        ></Label>
                                    </GridLayout>
                                </template>
                                <!-- end stations list -->

                                <!-- module list -->
                                <template v-if="showingModules">
                                    <StackLayout class="m-t-10"></StackLayout>
                                    <GridLayout
                                        rows="auto"
                                        columns="*"
                                        class="m-t-10 m-x-20"
                                        v-for="(m, moduleIndex) in modules"
                                        :key="m.id"
                                    >
                                        <StackLayout
                                            class="bordered-container p-10"
                                            @tap="goToCalibration(m)"
                                        >
                                            <GridLayout rows="auto, auto" columns="15*,70*,15*">
                                                <!-- module icon -->
                                                <Image
                                                    rowSpan="2"
                                                    col="0"
                                                    width="40"
                                                    horizontalAlignment="left"
                                                    :src="getModuleImage(m)"
                                                ></Image>
                                                <!-- module name -->
                                                <Label row="0" col="1" :text="getModuleName(m)" class="module-name" textWrap="true" />
                                                <!-- calibration status -->
                                                <Label
                                                    row="1"
                                                    col="1"
                                                    :text="m.calibratedLabel"
                                                    :class="'size-14 ' + m.calibratedClass"
                                                />
                                                <!-- calibration check mark -->
                                                <Image
                                                    rowSpan="2"
                                                    col="2"
                                                    width="20"
                                                    horizontalAlignment="right"
                                                    :src="m.calibratedImage"
                                                ></Image>
                                            </GridLayout>
                                        </StackLayout>
                                    </GridLayout>
                                </template>
                                <!-- end module list -->
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                    <!-- end other screens -->
                </GridLayout>
            </ScrollView>

            <!-- sticky next button -->
            <StackLayout :row="step.hasHeading ? 2 : 1" verticalAlignment="bottom" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded m-y-10"
                    :text="step.button"
                    :isEnabled="!step.buttonDisabled"
                    @tap="goNext"
                ></Button>
                <Label
                    :text="step.altOption"
                    class="skip"
                    @tap="skip"
                    textWrap="true"
                />
            </StackLayout>
            <!-- end sticky next button -->

            <!-- test connection screen -->
            <StackLayout
                row="0"
                rowSpan="2"
                v-if="testingConnection"
                height="100%"
                backgroundColor="white"
                verticalAlignment="middle"
            >
                <GridLayout rows="auto, auto" columns="*">
                    <StackLayout row="0" id="loading-circle-blue"></StackLayout>
                    <StackLayout row="0" id="loading-circle-white"></StackLayout>
                    <Label
                        row="1"
                        class="instruction m-t-20"
                        text="Connecting"
                        lineHeight="4"
                        textWrap="true"
                    ></Label>
                </GridLayout>
            </StackLayout>
            <!-- end test connection screen -->
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import { _T } from "../utilities"
import Services from "../services/services";
import ConnectStationForm from "./ConnectStationForm";

const dbInterface = Services.Database()
const calibrationService = Services.CalibrationService();
const sensorsThatCalibrate = ["ph", "do", "ec"];

export default {
    props: ["stepParam", "calibratedStation"],
    data() {
        return {
            step: {},
            stations: [],
            stationOptions: [],
            subtitle: "",
            hasForm: false,
            hasError: false,
            frameImage: "",
            displayFrame: null,
            testingConnection: false,
            showingModules: false,
            showingStations: false,
            modules: [],
            pending: {}
        };
    },
    components: {
        ConnectStationForm
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            if (this.stepParam && this.calibratedStation) {
                this.initFromParam();
                return;
            }

            this.$stationMonitor.subscribeAll(this.updateStations.bind(this));

            this.step = steps.intro;
            this.frameImage = this.step.images[0];
            this.displayFrame = this.frameImage
                ? "~/images/" + this.frameImage
                : null;
            if (this.displayFrame && !this.animateFrameTimer) {
                this.animateFrameTimer = setInterval(this.animateFrames, 1000);
            }
        },

        initFromParam() {
            this.station = this.calibratedStation;
            this.step = steps[this.stepParam];
            this.hasForm = this.step.hasForm;
            this.hasError = this.step.hasError;
            this.testingConnection = this.step.testingConnection;
            this.showingModules = this.step.showingModules;
            this.showingStations = this.step.showingStations;
            this.modules = this.station.moduleObjects;
            // the only stepParam currently is startCalibration
            if (this.showingModules) {
                this.assessCalibration();
            }
        },

        updateStations(data) {
            switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationsUpdatedProperty: {
                    this.stations = data.value.filter(s => { return s.connected; });
                    break;
                }
            }
        },

        goBack(event) {
            this.stopAnimation();
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            if (this.hasForm) {
                this.handleForm();
                return
            }

            if (this.step.prev) {
                this.step = steps[this.step.prev];
                this.setupStep();
            } else {
                this.unsubscribe();
                this.$navigateTo(routes.assembleStation, {
                    props: {
                        stepParam: "last"
                    }
                });
            }
        },

        goNext() {
            this.stopAnimation();
            if (this.hasForm) {
                this.handleForm();
                return
            }

            if(this.station && this.modules.length == 0) {
                this.fetchModules().then(this.setupModules).then(this.completeSetup);
            }

            if (this.step.next && this.step.next == "goToStations") {
                this.goToStations();
                return
            }

            if (this.step.next && this.step.next == "goToModuleAssembly") {
                this.goToModuleAssembly();
                return
            }

            if (this.step.next) {
                this.step = steps[this.step.next];
                this.setupStep();
            } else {
                // setTimeout(() => {
                //     this.$navigateTo(routes.stations);
                // }, 4000);
            }
        },

        setupStep() {
            this.subtitle = "";
            this.hasForm = this.step.hasForm;
            this.hasError = this.step.hasError;
            this.testingConnection = this.step.testingConnection;
            this.showingModules = this.step.showingModules;
            this.showingStations = this.step.showingStations;
            if (!this.step.hasHeading) {
                this.subtitle = this.step.title;
            }
            if (this.testingConnection) {
                this.preShowSpinner();
                this.connectingTimer = setInterval(this.showSpinner, 1000);
                this.checkForConnections();
            }
            if (this.showingModules) {
                this.assessCalibration();
            }
            if (this.step.images && this.step.images.length > 0) {
                this.animateFrames();
                if (!this.animateFrameTimer) {
                    this.animateFrameTimer = setInterval(
                        this.animateFrames,
                        1000
                    );
                }
            }
        },

        handleForm(){
            if (this.step.field == "stationName") {
                if (this.$refs.connectStationForm) {
                    this.$refs.connectStationForm.saveStationName();
                }
            }
            if (this.step.field == "ssid") {
                if (this.$refs.connectStationForm) {
                    this.$refs.connectStationForm.goToPassword();
                }
            } else if (this.step.field == "password") {
                if (this.$refs.connectStationForm) {
                    this.$refs.connectStationForm.addNetwork();
                }
            }
            this.hasForm = false;
            this.goNext();
        },

        skip() {
            this.stopAnimation();

            if (this.step.skip && this.step.skip == "tryAgain") {
                this.tryAgain();
                return
            }
            if (this.step.skip) {
                this.step.next = this.step.skip;
            }
            if (this.step.next && !this.showingModules) {
                this.goNext();
            } else {
                this.unsubscribe();
                this.$navigateTo(routes.stations);
            }
        },

        toggleChoice(radioOption) {
            this.step.options.forEach(option => {
                option.selected = false;
                if (option.text == radioOption.text) {
                    option.selected = true;
                    this.step.next = radioOption.next;
                }
            });
        },

        toggleStation(radioOption) {
            this.stationOptions.forEach(option => {
                option.selected = false;
                if (option.name == radioOption.name) {
                    option.selected = true;
                    this.station = this.stations.find(s => {
                        return s.name == option.name;
                    });
                }
            });
        },

        tryAgain() {
            this.station = null;
            this.modules = [];
            this.stations = [];
            this.step = steps["trouble"];
            this.goNext();
        },

        stopAnimation() {
            this.loadingWhite = null;
            this.displayFrame = null;
            clearInterval(this.animateFrameTimer);
            clearInterval(this.connectingTimer);
            this.animateFrameTimer = null;
            this.connectingTimer = null;
        },

        animateFrames() {
            this.frameImage =
                this.frameImage == this.step.images[0]
                    ? this.step.images[1]
                    : this.step.images[0];
            this.displayFrame = this.frameImage
                ? "~/images/" + this.frameImage
                : null;
        },

        preShowSpinner() {
            this.startedConnecting = Date.now();
            if (!this.loadingWhite) {
                // takes a sec for the elements to become defined
                // after this.testingConnection is set to true
                setTimeout(() => {
                    this.loadingWhite = this.page.getViewById("loading-circle-white");
                    if (this.loadingWhite) {
                        this.loadingWhite
                            .animate({
                                rotate: 360,
                                duration: 1000
                            });
                    }
                }, 250);
            }
        },

        showSpinner() {
            this.checkForConnections();
            // stop trying if > 5 sec
            if (Date.now() - this.startedConnecting > 5500) {
                clearInterval(this.connectingTimer);
                this.goNext();
            }
            if (this.loadingWhite) {
                this.loadingWhite.rotate = 0;
                this.loadingWhite
                    .animate({
                        rotate: 360,
                        duration: 1000
                    });
            }
        },

        checkForConnections() {
            if (this.stations && this.stations.length > 0) {
                clearInterval(this.connectingTimer);
                this.step.next = this.step.proceed;
                this.stationOptions = this.stations.map((s, i) => {
                    return {
                        id: "id-" + i,
                        name: s.name,
                        selected: i == 0
                    };
                });
                // still choose the first one by default
                this.station = this.stations[0];
                this.goNext();
            } else {
                this.step.next = "trouble";
            }
        },

        goToStations() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(routes.stations, {
                clearHistory: true,
                backstackVisible: false
            });
        },

        goToModuleAssembly() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(routes.assembleStation, {
                props: {
                    stepParam: 3
                }
            });
        },

        fetchModules() {
            return dbInterface.getModules(this.station.id);
        },

        getSensors(moduleObject) {
            return dbInterface.getSensors(moduleObject.deviceId).then(sensors => {
                moduleObject.sensorObjects = sensors
            })
        },

        setupModules(modules) {
            this.station.moduleObjects = modules;
            return Promise.all(this.station.moduleObjects.map(this.getSensors));
        },

        completeSetup() {
            if (this.modules.length == 0) {
                this.updateModules(this.station.moduleObjects);
            }
        },

        assessCalibration() {
            this.subtitle = this.station.name;
            if (this.modules.length === 0) {
                this.step = steps["noModules"];
                this.setupStep();
                return
            }
            const toCalibrate = this.modules.filter(m => {
                return !m.calibratedLabel || m.calibratedLabel == "Uncalibrated";
            });
            if (toCalibrate.length == 0) {
                this.step = steps.endCalibration;
            }
        },

        unsubscribe() {
            this.$stationMonitor.unsubscribeAll();
        },

        goToCalibration(m) {
            if (m.calibratedLabel != "Uncalibrated") {
                return
            }

            this.stopAnimation();
            this.unsubscribe();
            // navigate to calibration
            this.$navigateTo(routes.calibration, {
                clearHistory: true,
                backstackVisible: false,
                props: {
                    station: this.station,
                    calibrationType: m.calibrateSensor,
                    onboarding: true
                }
            });
        },

        updateModules(modules) {
            this.modules = modules.sort((a, b) => {
                return b.position < a.position ? 1 : b.position > a.position ? -1 : 0
            })
            this.modules.forEach(m => {
                m.calibratedLabel = "";
                m.calibratedClass = "gray-text";
                m.calibratedImage = "";
                m.sensorObjects.forEach(s => {
                    this.checkCalibrationStatus(m, s);
                });
            });
        },

        checkCalibrationStatus(m, s) {
            if (
                m.position
                && this.station.url
                && !this.pending[m.position]
                && sensorsThatCalibrate.indexOf(s.name) > -1
            ) {
                m.calibrateSensor = s.name;
                // keep track so many requests aren't sent at once
                this.pending[m.position] = true;
                const connectView = this;
                calibrationService
                    .getCalibrationStatus(this.station.url + "/module/" + m.position)
                    .then(result => {
                        connectView.handleCalibrationResult(result, m, s.name);
                    });
            } else if (!this.pending[m.position]) {
                m.calibratedLabel = "No calibration needed";
                m.calibratedImage = "~/images/Icon_Success.png";
            }
        },

        handleCalibrationResult(result, m, sensorName) {
            let total = 0;
            if (sensorName == "ph") {
                if (result.calibration.phStatus) {
                    total = _.sum(_.values(result.calibration.phStatus));
                }
            }
            if (sensorName == "do") {
                if (result.calibration.doStatus) {
                    total = _.sum(_.values(result.calibration.doStatus));
                }
            }
            if (sensorName == "ec") {
                if (result.calibration.ecStatus) {
                    total = _.sum(_.values(result.calibration.ecStatus));
                }
            }
            m.calibratedLabel = total > 0 ? "Calibrated" : "Uncalibrated";
            m.calibratedClass = total > 0 ? "gray-text" : "red-text";
            m.calibratedImage = total > 0 ? "~/images/Icon_Success.png" : "";
            this.pending[m.position] = false;
        },

        getModuleImage(module) {
            switch (module.name) {
                case "modules.distance":
                    return "~/images/Icon_Distance_Module.png"
                    break
                case "modules.weather":
                    return "~/images/Icon_Weather_Module.png "
                    break
                case "modules.water.ec":
                    return "~/images/Icon_WaterConductivity_Module.png"
                    break
                case "modules.water.ph":
                    return "~/images/Icon_WaterpH_Module.png"
                    break
                case "modules.water.do":
                    return "~/images/Icon_DissolvedOxygen_Module.png"
                    break
                case "modules.water.temp":
                    return "~/images/Icon_WaterTemp_Module.png"
                    break
                case "modules.water.orp":
                    return "~/images/Icon_Water_Module.png"
                    break
                case "modules.water.unknown":
                    return "~/images/Icon_Water_Module.png"
                    break
                default:
                    return "~/images/Icon_Generic_Module.png"
                    break
            }
        },

        getModuleName(module) {
            return _T(module.name + ".name");
        }
    }
};

const steps = {
    "intro":
        {
            prev: null,
            next: "connect",
            hasHeading: true,
            title: "FieldKit Station WiFi",
            instructions:
                [
                    "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to your mobile device.",
                    "Confirm that your station WiFi is on by pressing the external WiFi button."
                ],
            button: "Connect Station",
            images: ["TI_9-A.jpg", "TI_9-B.jpg"],
            altOption: "Skip this step"
        },
    "connect":
        {
            prev: "intro",
            next: "testConnection",
            hasHeading: true,
            title: "Connect your FieldKit Station",
            instructions:
                [
                    "To connect to your station, go to your mobile phone WiFi settings and select the station's WiFi name as displayed on the station screen."
                ],
            button: "Done",
            images: ["TI_10-A.jpg", "TI_10-A.jpg"],
            altOption: "Skip this step"
        },
    "trouble":
        {
            hasError: true,
            prev: "connect",
            next: "testConnection",
            hasHeading: false,
            title: "Having Problems Connecting?",
            instructions:
                [
                    "1. Press the WiFi button again",
                    "2. Turn on station's WiFi access point directly from the station settings menu",
                    "3. If you are still having trouble get help at our support and troubleshooting center"
                ],
            button: "Try Again",
            images: [],
            altOption: "Get help"
        },
    "selectStation":
        {
            showingStations: true,
            prev: "connect",
            next: "selectSettings",
            skip: "tryAgain",
            hasHeading: false,
            title: "Select Your Station",
            instructions: ["We found FieldKit Stations. Choose the station you want to connect to."],
            button: "Next",
            images: [],
            altOption: "Don't see your station? Try again."
        },
    "selectSettings":
       {
            prev: "selectStation",
            next: "rename",
            hasHeading: false,
            title: "Choose WiFi Settings",
            instructions: ["Choose how you would like to sync your data"],
            button: "Next",
            images: [],
            options: [
                {
                    text: "Station WiFi (default)",
                    info: "Your FieldKit station has its own WiFi signal, acting as a hotspot and allowing connection to a mobile device",
                    next: "rename",
                    selected: true
                },
                {
                    text: "Your WiFi Network",
                    info: "Connect your FieldKit station directly to your own WiFi network to sync data with the FieldKit portal directly",
                    next: "ssid",
                    selected: false
                },
            ]
        },
    "rename":
       {
            hasForm: true,
            prev: "selectSettings",
            next: "reconnect",
            skip: "testNewConnection",
            hasHeading: false,
            title: "Change your FieldKit station name?",
            instructions: ["You can change the name or leave it the same. You can always change it later."],
            button: "Save New Name",
            images: [],
            label: "",
            field: "stationName",
            hint: "Enter a name for your station",
            altOption: "Skip this step"
        },
    "reconnect":
        {
            prev: "rename",
            next: "testNewConnection",
            hasHeading: true,
            title: "Reconnect to your FieldKit Station",
            instructions:
                [
                    "To reconnect to your station, go to your mobile phone WiFi settings and select the station's new WiFi name as displayed on the station screen."
                ],
            button: "Done",
            images: ["TI_10-A.jpg", "TI_10-A.jpg"],
            altOption: "Skip this step"
        },
    "ssid":
       {
            hasForm: true,
            prev: "selectSettings",
            next: "password",
            hasHeading: false,
            title: "Your WiFi Network",
            instructions: ["Enter the name of the WiFi network you would like to connect your FieldKit station to"],
            button: "Next",
            images: [],
            label: "",
            field: "ssid",
            hint: "Enter WiFi network name"
        },
    "password":
       {
            hasForm: true,
            prev: "ssid",
            next: "testNewConnection",
            hasHeading: false,
            title: "Your WiFi Network",
            instructions: ["Enter network password"],
            button: "Next",
            images: [],
            label: "",
            field: "password",
            hint: "Enter network password"
        },
    "testConnection":
       {
            testingConnection: true,
            prev: "",
            next: "",
            proceed: "selectStation",
            hasHeading: false,
            title: "",
            instructions: ["Connecting"],
            button: "",
            images: []
        },
    "testNewConnection":
       {
            testingConnection: true,
            prev: "",
            next: "",
            proceed: "startCalibration",
            hasHeading: false,
            title: "",
            instructions: ["Connecting"],
            button: "",
            images: []
        },
    "startCalibration":
        {
            showingModules: true,
            prev: "",
            next: "",
            hasHeading: false,
            title: "",
            instructions: ["Let's set up your station before you deploy!", "To complete setup, calibrate each sensor module for accurate data readings.", "Tap an uncalibrated module below to get started."],
            button: "Done",
            buttonDisabled: true,
            images: [],
            progressImage: "~/images/Icon_incomplete.png",
            altOption: "Set up later"
        },
    "endCalibration":
        {
            showingModules: true,
            prev: "",
            next: "goToStations",
            hasHeading: false,
            title: "",
            instructions: ["Your FieldKit station setup is complete."],
            button: "Done",
            images: [],
            progressImage: "~/images/Icon_complete.png"
        },
    "noModules":
        {
            hasError: true,
            prev: "startCalibration",
            next: "goToModuleAssembly",
            skip: "goToStations",
            hasHeading: false,
            title: "No Modules Connected",
            instructions: ["Complete your FieldKit Station by adding sensor modules."],
            button: "Add Modules",
            images: [],
            altOption: "Continue without modules"
        }
};

</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
#loading-circle-blue,
#loading-circle-white {
    width: 75;
    height: 75;
    background: $fk-gray-white;
    border-width: 2;
    border-radius: 60%;
}
#loading-circle-white {
    border-color: $fk-gray-white;
    clip-path: circle(100% at 50% 0);
}
#loading-circle-blue {
    border-color: $fk-secondary-blue;
}
.page {
    color: $fk-primary-black;
}

.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
.option-container {
    margin-top: 30;
    margin-left: 30;
    margin-right: 30;
}
.radio-info {
    color: $fk-gray-hint;
    margin-top: 10;
    margin-bottom: 20;
    margin-left: 35;
}
.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
}
.small {
    width: 50;
    margin: 20;
}

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.module-name {
    font-size: 18;
    // margins set in OS-specific CSS
}
.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
</style>
