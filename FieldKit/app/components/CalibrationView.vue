<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="82,*,80">
            <!-- header section -->
            <GridLayout row="0" rows="auto" columns="15*,70*,15*" class="m-t-20 m-b-10">
                <template v-if="currentCalibration">
                    <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_Backarrow.png" />
                    </StackLayout>
                    <GridLayout col="1" rows="auto,auto" columns="*">
                        <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
                        <Label row="1" class="text-center subtitle" :text="currentCalibration.title" textWrap="true"></Label>
                    </GridLayout>
                    <StackLayout col="2" class="m-t-2 m-r-10">
                        <Image width="35" :src="currentCalibration.icon" />
                    </StackLayout>
                </template>
            </GridLayout>
            <!-- end header section -->

            <!-- calibration steps -->
            <StackLayout row="1">
                <!-- progress bar at top -->
                <GridLayout order="1" rows="auto, auto" columns="*" class="top-line-bkgd m-t-10" v-if="currentCalibration">
                    <StackLayout row="0" horizontalAlignment="left" :width="percentDone + '%'" class="top-line"></StackLayout>
                    <!-- station disconnected warning -->
                    <StackLayout row="1" class="text-center disconnect-warning" v-if="!currentStation.connected">
                        <Label text="Station disconnected. Tap here to reconnect." class="size-15" textWrap="true" @tap="goToReconnect" />
                    </StackLayout>
                </GridLayout>
                <!-- end progress bar -->

                <Label
                    order="2"
                    v-if="currentCalibration"
                    :class="'instruction-heading ' + (expectedValue ? '' : 'm-b-20')"
                    :text="instructionHeading"
                    lineHeight="4"
                    textWrap="true"
                ></Label>
                <Label
                    order="3"
                    v-if="expectedValue"
                    class="size-14 text-center"
                    :text="'Expected value: ' + expectedValue"
                    lineHeight="4"
                    textWrap="true"
                ></Label>
                <Label order="4" v-if="currentCalibration" class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>

                <!-- pH calibration type choice -->
                <StackLayout order="5" class="radio-container">
                    <GridLayout rows="auto" columns="30,*" v-for="option in options" :key="option.value" class="option-container">
                        <check-box
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
                        <Label col="1" class="m-t-5 m-l-5" :text="option.text"></Label>
                    </GridLayout>
                </StackLayout>
                <!-- end pH calibration type choice -->

                <GridLayout order="6" rows="*" columns="*">
                    <Image verticalAlignment="middle" class="illo" v-if="displayImage" :src="displayImage"></Image>
                </GridLayout>
            </StackLayout>
            <!-- end calibration steps section -->

            <!-- sensor reading and timer -->
            <GridLayout row="1" rows="auto,auto" columns="*" class="timer-container" :opacity="timerRunning ? 1 : 0">
                <!-- current reading -->
                <GridLayout row="0" id="inner-circle">
                    <FlexboxLayout verticalAlignment="middle" justifyContent="center">
                        <!-- prefix unit -->
                        <Label
                            :text="currentCalibration.unit"
                            verticalAlignment="bottom"
                            class="m-r-5 m-t-5 size-14 calibration-unit"
                            :opacity="currentCalibration.key == 'ph' ? 1 : 0"
                        />
                        <!-- reading -->
                        <Label flexShrink="0.25" :text="currentReading" verticalAlignment="bottom" class="size-26" />
                        <!-- suffix unit -->
                        <Label
                            :text="currentCalibration.unit"
                            verticalAlignment="bottom"
                            class="m-l-5 m-t-5 size-14 calibration-unit"
                            :opacity="currentCalibration.key == 'ph' ? 0 : 1"
                        />
                    </FlexboxLayout>
                </GridLayout>
                <!-- progress circle -->
                <StackLayout row="0">
                    <CircularProgressBar size="200" :progress="timerProgress" :animated="animatedTimer" class="flip" />
                </StackLayout>
                <!-- timer -->
                <StackLayout row="1">
                    <Label class="size-20 elapsed-time elapsed-time-top" :text="elapsedTime"></Label>
                    <Label class="size-14 elapsed-time" :text="elapsedTimeLabel"></Label>
                </StackLayout>
            </GridLayout>

            <!-- sticky next button -->
            <StackLayout row="2">
                <Button
                    v-if="currentCalibration"
                    class="btn btn-primary btn-padded"
                    :text="buttonText"
                    :isEnabled="nextEnabled"
                    @tap="goNext"
                ></Button>
            </StackLayout>
            <!-- end sticky next button -->

            <!-- loading animation -->
            <GridLayout row="1" rowSpan="2" rows="auto" columns="*" v-if="loading" class="text-center loading-container">
                <StackLayout id="loading-circle-blue"></StackLayout>
                <StackLayout id="loading-circle-white"></StackLayout>
            </GridLayout>

            <!-- success screen -->
            <StackLayout rowSpan="3" v-if="success" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="auto, auto" columns="*">
                    <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
                    <Label row="1" text="Calibrated" class="instruction-heading"></Label>
                </GridLayout>
            </StackLayout>
            <!-- end success screen -->

            <!-- failure screen -->
            <StackLayout rowSpan="3" v-if="failure" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="*,80,60" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <Image row="0" src="~/images/Icon_Warning_error.png" class="small"></Image>
                        <Label row="1" text="Calibration Failed" class="instruction-heading"></Label>
                        <Label
                            row="2"
                            text="Looks like an error occured. Try calibration again now or try later if you prefer."
                            class="instruction"
                            textWrap="true"
                        ></Label>
                    </StackLayout>
                    <Button row="1" class="btn btn-primary btn-padded" text="Calibrate Again" @tap="startOver"></Button>
                    <Label row="2" text="Calibrate later" class="skip" @tap="skip"></Label>
                </GridLayout>
            </StackLayout>
            <!-- end failure screen -->
        </GridLayout>
    </Page>
</template>

<script>
import { on, off, suspendEvent, resumeEvent } from "tns-core-modules/application";
import { BetterObservable } from "../services/rx";
import routes from "../routes";
import Services from "../services/services";
import CircularProgressBar from "./CircularProgressBar";
import ConnectStationModules from "./onboarding/ConnectStationModules";

const calibrationService = Services.CalibrationService();
const dbInterface = Services.Database();

export default {
    props: ["type", "station", "recalibrate", "onboarding"],
    data() {
        return {
            step: -1,
            title: "Set Up",
            instruction: "",
            instructionHeading: "",
            expectedValue: "",
            options: [],
            buttonText: "Next",
            displayImage: null,
            percentDone: 0,
            nextEnabled: true,
            currentStation: {},
            calibrationType: "",
            currentCalibration: {},
            currentReading: "--",
            animatedTimer: true,
            timerRunning: false,
            timerProgress: 0,
            elapsedTime: "--:--",
            elapsedTimeLabel: "min sec",
            success: false,
            failure: false,
            loading: true,
            suspended: false,
        };
    },
    components: {
        CircularProgressBar,
        ConnectStationModules,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            this.loadingWhite = this.page.getViewById("loading-circle-white");
            this.loading = false; // after loadingWhite defined

            on(suspendEvent, args => {
                // set flag if in the middle of countdown
                if (this.timerRunning) {
                    this.suspended = true;
                }
            });

            on(resumeEvent, args => {
                if (this.suspended) {
                    this.timerInterval = setInterval(this.updateTimer, 500);
                }
                this.suspended = false;
            });

            if (!this.suspended) {
                this.calibrationType = this.type;
                this.currentCalibration = calibrations[this.calibrationType];
                if (this.station) {
                    this.currentStation = this.station;
                    this.completeSetup();
                }
                if (this.recalibrate && this.currentStation) {
                    this.loading = true;
                    this.loadingTimer = setInterval(this.showLoadingAnimation, 1000);
                    this.clearCalibration(this.recalibrate).then(this.goNext);
                } else if (this.currentCalibration) {
                    this.goNext();
                } else {
                    // handle no calibration type and/or steps
                }
            }
        },

        onUnloaded() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            if (this.loadingTimer) {
                clearInterval(this.loadingTimer);
            }
        },

        goToReconnect() {
            this.$navigateTo(routes.connectStation, {
                props: {
                    stepParam: "testConnection",
                },
            });
        },

        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            if (this.calibrationType == "quickCal" || this.calibrationType == "threePoint") {
                if (this.step == 0) {
                    this.calibrationType = "ph";
                    this.currentCalibration = calibrations[this.calibrationType];
                    this.step = 1;
                }
            }

            const steps = this.currentCalibration.steps;
            if (this.step > 0) {
                this.step -= 1;
                this.setupStep(steps);
                this.setupOptions();
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
                // handle timer step on back btn?
                // if (steps[this.step].isTimer) {
                //     this.nextEnabled = false;
                //     this.timerRunning = true;
                //     this.stopTime = steps[this.step].time;
                //     this.startTimer();
                // }
            } else {
                if (this.onboarding) {
                    this.$navigateTo(ConnectStationModules, {
                        props: {
                            stepParam: "startCalibration",
                            stationParam: this.currentStation,
                        },
                    });
                } else if (this.currentStation && this.currentStation.id) {
                    this.$navigateTo(routes.stationDetail, {
                        props: {
                            stationId: this.currentStation.id,
                        },
                    });
                } else {
                    this.$navigateTo(routes.stations);
                }
            }
        },

        goNext() {
            const address = this.currentStation.url + "/module/" + this.bay;
            const data = {
                temp: this.currentTemp,
            };

            const steps = this.currentCalibration.steps;
            // check to see if ec or pH needs calibration performed,
            // as it's not just always the last step, with three-point
            if (this.performCal) {
                switch (steps[this.step].performCal) {
                    case "mid":
                        this.performMidPhCalibration(address, data);
                        break;
                    case "low":
                        this.performLowPhCalibration(address, data);
                        break;
                    case "dry":
                        this.performDryEcCalibration(address, data);
                        break;
                }
                return;
            }

            if (this.step < steps.length - 1) {
                this.step += 1;
                this.setupStep(steps);
                if (steps[this.step].isTimer) {
                    this.nextEnabled = false;
                    this.timerRunning = true;
                    this.stopTime = steps[this.step].time;
                    this.startTimer(steps[this.step].clearCal);
                }
                this.setupOptions();
            } else {
                // perform calibration
                switch (this.calibrationType) {
                    case "quickCal":
                        this.performQuickPhCalibration(address, data);
                        break;
                    case "threePoint":
                        // the last calibration for three-point
                        this.performHighPhCalibration(address, data);
                        break;
                    case "do":
                        this.performDoCalibration(address, data);
                        break;
                    case "ec":
                        this.performEcCalibration(address, data);
                        break;
                }
            }
            this.loading = false;
            if (this.loadingTimer) {
                clearInterval(this.loadingTimer);
            }
        },

        setupStep(steps) {
            // reset timer things
            this.animatedTimer = false;
            this.timerProgress = 0;
            this.nextEnabled = true;
            this.timerRunning = false;
            this.percentDone = ((this.step + 1) / (steps.length + 1)) * 100;
            this.displayImage = steps[this.step].image;
            this.instructionHeading = steps[this.step].heading;
            this.expectedValue = steps[this.step].expectedValue;
            this.options = steps[this.step].options;
            this.instruction = steps[this.step].instruction;
            this.buttonText = steps[this.step].buttonText;
            this.performCal = steps[this.step].performCal;
        },

        setupOptions() {
            if (this.options) {
                // select one by default, in case they never toggle
                this.options.forEach(option => {
                    if (option.selected) {
                        this.calibrationType = option.value;
                        this.currentCalibration = calibrations[option.value];
                    }
                });
                this.step = -1;
            }
        },

        clearCalibration(bay) {
            return calibrationService.clearCalibration(this.currentStation.url + "/module/" + bay);
        },

        performQuickPhCalibration(address, data) {
            return calibrationService.calibrateQuickPh(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.endCalibration(body.calibration.phStatus.middle);
            });
        },

        performMidPhCalibration(address, data) {
            return calibrationService.calibrateMidPh(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.performCal = false;
                if (body.calibration.phStatus.middle > 0) {
                    this.goNext();
                } else {
                    this.failure = true;
                }
            });
        },

        performLowPhCalibration(address, data) {
            return calibrationService.calibrateLowPh(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.performCal = false;
                if (body.calibration.phStatus.low > 0) {
                    this.goNext();
                } else {
                    this.failure = true;
                }
            });
        },

        performHighPhCalibration(address, data) {
            return calibrationService.calibrateHighPh(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.endCalibration(body.calibration.phStatus.high);
            });
        },

        performDoCalibration(address, data) {
            return calibrationService.calibrateAtmosphereDissolvedOxygen(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.endCalibration(body.calibration.doStatus.atm);
            });
        },

        performDryEcCalibration(address, data) {
            return calibrationService.calibrateDryConductivity(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.performCal = false;
                if (body.calibration.ecStatus.dry > 0) {
                    this.goNext();
                } else {
                    this.failure = true;
                }
            });
        },

        performEcCalibration(address, data) {
            return calibrationService.calibrateSingleConductivity(address, data).then(body => {
                if (body.errors && body.errors.length > 0) {
                    this.failure = true;
                    return;
                }
                this.endCalibration(body.calibration.ecStatus.single);
            });
        },

        endCalibration(result) {
            if (result && result > 0) {
                this.success = true;
                this.currentStation.moduleObjects.forEach(m => {
                    m.sensorObjects.forEach(s => {
                        if (s.name == this.currentCalibration.key) {
                            // record these for onboarding views
                            m.calibratedLabel = "Calibrated";
                            m.calibratedClass = "gray-text";
                            m.calibratedImage = "~/images/Icon_Success.png";
                        }
                    });
                });

                setTimeout(() => {
                    if (this.onboarding) {
                        this.$navigateTo(ConnectStationModules, {
                            props: {
                                stepParam: "startCalibration",
                                stationParam: this.currentStation,
                            },
                        });
                    } else {
                        this.$navigateTo(routes.stationDetail, {
                            props: {
                                stationId: this.currentStation.id,
                            },
                        });
                    }
                }, 3000);
            } else {
                this.failure = true;
            }
        },

        toggleChoice(radioOption) {
            this.options.forEach(option => {
                option.selected = false;
                if (option.text == radioOption.text) {
                    option.selected = true;
                    this.calibrationType = radioOption.value;
                    this.currentCalibration = calibrations[radioOption.value];
                    this.step = -1;
                }
            });
        },

        getFromDatabase() {
            dbInterface
                .getStation(this.paramId)
                .then(this.getModules)
                .then(this.setupModules)
                .then(this.completeSetup);
        },

        getModules(stations) {
            if (stations.length == 0) {
                // wait a few seconds and try again
                setTimeout(this.getFromDatabase, 2000);
                return Promise.reject();
            }
            this.currentStation = stations[0];
            return dbInterface.getModules(this.currentStation.id);
        },

        getSensors(moduleObject) {
            return dbInterface.getSensors(moduleObject.deviceId).then(sensors => {
                moduleObject.sensorObjects = sensors;
            });
        },

        setupModules(modules) {
            this.currentStation.moduleObjects = modules;
            return Promise.all(this.currentStation.moduleObjects.map(this.getSensors));
        },

        completeSetup() {
            this.$stationMonitor.on(
                BetterObservable.propertyChangeEvent,
                data => {
                    switch (data.propertyName.toString()) {
                        case this.$stationMonitor.StationRefreshedProperty: {
                        }
                        case this.$stationMonitor.ReadingsChangedProperty: {
                            if (data.value.stationId == this.currentStation.id) {
                                this.updateCurrentReading(data.value.readings);
                            }
                            break;
                        }
                    }
                },
                error => {
                    // console.log("propertyChangeEvent error", error);
                }
            );
            // start getting live readings for this station
            if (this.currentStation.url != "no_url") {
                // see if live readings have been stored already
                const readings = this.$stationMonitor.getStationReadings(this.currentStation);
                if (readings) {
                    this.updateCurrentReading(readings);
                }
                this.$stationMonitor.startLiveReadings(this.currentStation.url);
            }
        },

        updateCurrentReading(readings) {
            if (!readings) {
                return;
            }
            this.currentStation.moduleObjects.forEach(m => {
                m.sensorObjects.forEach(s => {
                    if (s.name == this.currentCalibration.key) {
                        // store module position for calibration query
                        this.bay = m.position;
                        const reading = readings[m.name + s.name];
                        if (reading || reading === 0) {
                            this.currentReading = +reading.toFixed(2);
                        }
                    }
                    if (s.name == "temp") {
                        const reading = readings[m.name + s.name];
                        if (reading || reading === 0) {
                            this.currentTemp = +reading.toFixed(2);
                        }
                    }
                });
            });
        },

        startTimer(clearCal) {
            if (clearCal) {
                this.clearCalibration(this.bay);
            }
            this.started = Date.now();
            this.elapsedTime = "01:30";
            this.timerProgress = 0;
            this.timerInterval = setInterval(this.updateTimer, 500);
        },

        updateTimer() {
            this.animatedTimer = true;
            const elapsed = Date.now() - this.started;
            if (elapsed > this.stopTime) {
                clearInterval(this.timerInterval);
                this.nextEnabled = true;
                this.elapsedTime = "00:00";
            }

            this.timerProgress = (elapsed / this.stopTime) * 100;

            const countdown = this.stopTime - elapsed;
            if (countdown >= 0) {
                let seconds = Math.floor((countdown / 1000) % 60);
                seconds = seconds < 10 ? "0" + seconds : seconds;
                let minutes = Math.floor((countdown / (1000 * 60)) % 60);
                minutes = minutes < 10 ? "0" + minutes : minutes;
                this.elapsedTime = minutes + ":" + seconds;
            }
        },

        startOver() {
            this.step = -1;
            this.title = "Set Up";
            this.instruction = "";
            this.instructionHeading = "";
            this.expectedValue = "";
            this.options = [];
            this.buttonText = "Next";
            this.displayImage = null;
            this.percentDone = 0;
            this.nextEnabled = true;
            this.currentReading = "--";
            this.currentTemp = null;
            this.animatedTimer = true;
            this.timerRunning = false;
            this.timerProgress = 0;
            this.elapsedTime = "--:--";
            this.elapsedTimeLabel = "min sec";
            this.success = false;
            this.failure = false;
            this.goNext();
        },

        skip() {
            this.$navigateTo(routes.stations);
        },

        showLoadingAnimation() {
            this.loadingWhite
                .animate({
                    rotate: 360,
                    duration: 975,
                })
                .then(() => {
                    this.loadingWhite.rotate = 0;
                });
        },
    },
};

const calibrations = {
    ph: {
        key: "ph",
        unit: "pH",
        title: "Water pH",
        icon: "~/images/Icon_WaterpH_Module.png",
        steps: [
            {
                heading: "Choose calibration type",
                instruction: "Would you like to perform quick calibration or three-point calibration?",
                options: [
                    {
                        text: "Quick calibration",
                        value: "quickCal",
                        selected: true,
                    },
                    {
                        text: "Three-point calibration",
                        value: "threePoint",
                        selected: false,
                    },
                ],
                image: "",
                buttonText: "Next",
            },
        ],
    },
    quickCal: {
        key: "ph",
        unit: "pH",
        title: "Water pH",
        icon: "~/images/Icon_WaterpH_Module.png",
        steps: [
            {
                heading: "Quick pH Calibration",
                instruction: "Make sure you have your quick calibration pH solution.",
                image: "~/images/TI_11.jpg",
                buttonText: "Next",
            },
            {
                heading: "Quick pH Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Quick pH Calibration",
                instruction: "Place probe inside cup with solution. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-C.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: true,
                time: 90000,
                heading: "Quick pH Calibration",
                expectedValue: "6.86",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
        ],
    },
    threePoint: {
        key: "ph",
        unit: "pH",
        title: "Water pH",
        icon: "~/images/Icon_WaterpH_Module.png",
        steps: [
            {
                heading: "Three-point Calibration",
                instruction: "Make sure you have your pH calibration fluids for pH levels 7, 4, and 10.",
                image: "~/images/TI_11_three_bottles.jpg",
                buttonText: "Next",
            },
            {
                heading: "Mid-point Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Mid-point Calibration",
                instruction: "Place probe inside cup with 7.0 solution. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-C.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: true,
                performCal: "mid",
                time: 90000,
                heading: "Mid-point Calibration",
                expectedValue: "7.0",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
            {
                heading: "Low-point Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Low-point Calibration",
                instruction: "Place probe inside cup with 4.0 solution. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-C.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: false,
                performCal: "low",
                time: 90000,
                heading: "Low-point Calibration",
                expectedValue: "4.0",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
            {
                heading: "High-point Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "High-point Calibration",
                instruction: "Place probe inside cup with 10.0 solution. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-C.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: false,
                time: 90000,
                heading: "High-point Calibration",
                expectedValue: "10.0",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
        ],
    },
    do: {
        key: "do",
        unit: "mg/L",
        title: "Water Dissolved Oxygen",
        icon: "~/images/Icon_DissolvedOxygen_Module.png",
        steps: [
            {
                heading: "Dissolved Oxygen Calibration",
                instruction: "Make sure you dry your probe before calibration.",
                image: "~/images/TI_16-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Dissolved Oxygen Calibration",
                instruction: "Hold probe out in the atmosphere.",
                image: "~/images/TI_16-B.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: true,
                time: 90000,
                heading: "Dissolved Oxygen Calibration",
                expectedValue: "0",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
        ],
    },
    ec: {
        key: "ec",
        unit: "μS",
        title: "Water Electrical Conductivity",
        icon: "~/images/Icon_WaterConductivity_Module.png",
        steps: [
            {
                heading: "Part 1: Dry Conductivity Calibration",
                instruction: "Make sure you dry your probe before calibration.",
                image: "~/images/TI_16-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Part 1: Dry Conductivity Calibration",
                instruction: "Hold probe out in the atmosphere.",
                image: "~/images/TI_16-B.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: true,
                performCal: "dry",
                time: 90000,
                heading: "Part 1: Dry Conductivity Calibration",
                expectedValue: "0",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
            {
                heading: "Part 2: Wet Conductivity Calibration",
                instruction: "Make sure you have your conductivity solution.",
                image: "~/images/TI_11.jpg",
                buttonText: "Next",
            },
            {
                heading: "Part 2: Wet Conductivity Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next",
            },
            {
                heading: "Part 2: Wet Conductivity Calibration",
                instruction:
                    "Place probe inside cup with solution and let the readings stabilize. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-C.jpg",
                buttonText: "Start Timer",
            },
            {
                isTimer: true,
                clearCal: true,
                time: 90000,
                heading: "Part 2: Wet Conductivity Calibration",
                expectedValue: "12,880",
                instruction: "",
                image: null,
                buttonText: "Calibrate",
            },
        ],
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
.loading-container {
    width: 100%;
    height: 100%;
    margin-top: 100;
    background-color: white;
}
#loading-circle-blue,
#loading-circle-white {
    width: 90;
    height: 90;
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
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.blue {
    color: $fk-primary-blue;
}

.top-line-bkgd {
    background-color: $fk-gray-lighter;
    margin-bottom: 40;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
.instruction-heading,
.instruction {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
}
.instruction-heading {
    font-size: 18;
}
.instruction {
    font-size: 16;
}
.illo {
    margin: 20;
}
.radio-container {
    font-size: 18;
    margin-top: 20;
    margin-left: 40;
}
.option-container {
    margin-bottom: 10;
}
.timer-container {
    margin-top: 140;
    text-align: center;
}

#inner-circle {
    background-color: white;
    width: 190;
    height: 190;
}
.elapsed-time {
    text-align: center;
}
.elapsed-time-top {
    margin-top: 35;
    margin-bottom: 5;
}
.small {
    width: 50;
    margin: 20;
}
.skip {
    width: 200;
    padding-top: 10;
    padding-bottom: 10;
    font-size: 16;
    text-align: center;
}
.flip {
    transform: scale(-1, 1);
}
</style>
