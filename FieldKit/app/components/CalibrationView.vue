<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="75,*,80">
            <!-- header section -->
            <GridLayout
                row="0"
                rows="auto"
                columns="15*,70*,15*"
                class="m-y-20"
            >
                <template v-if="currentCalibration">
                    <StackLayout
                        col="0"
                        class="round-bkgd"
                        verticalAlignment="top"
                        @tap="goBack"
                    >
                        <Image width="21" src="~/images/Icon_Backarrow.png" />
                    </StackLayout>
                    <GridLayout col="1" rows="auto,auto" columns="*">
                        <Label
                            row="0"
                            class="title m-t-10 m-b-5 text-center"
                            :text="title"
                            textWrap="true"
                        ></Label>
                        <Label
                            row="1"
                            class="text-center subtitle"
                            :text="currentCalibration.title"
                            textWrap="true"
                        ></Label>
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
                <GridLayout
                    order="1"
                    rows="auto"
                    columns="*"
                    class="top-line-bkgd m-t-10"
                    v-if="currentCalibration"
                >
                    <StackLayout
                        horizontalAlignment="left"
                        :width="percentDone + '%'"
                        class="top-line"
                    ></StackLayout>
                </GridLayout>
                <!-- end progress bar -->

                <Label
                    order="2"
                    v-if="currentCalibration"
                    class="instruction-heading"
                    :text="instructionHeading"
                    lineHeight="4"
                    textWrap="true"
                ></Label>
                <Label
                    order="3"
                    v-if="currentCalibration"
                    class="instruction"
                    :text="instruction"
                    lineHeight="4"
                    textWrap="true"
                ></Label>

                <GridLayout order="4" rows="*" columns="*">
                    <Image
                        verticalAlignment="middle"
                        order="3"
                        class="illo"
                        v-if="displayImage"
                        :src="displayImage"
                    ></Image>
                </GridLayout>

            </StackLayout>
            <!-- end calibration steps section -->

            <!-- sensor reading and timer -->
            <GridLayout
                row="1"
                rows="auto,auto"
                columns="*"
                class="timer-container"
                :opacity="timerRunning ? 1 : 0"
            >
                <StackLayout row="0" id="background-circle" />
                <StackLayout row="0" id="color-circle" />
                <GridLayout row="0" id="inner-circle" >
                    <FlexboxLayout justifyContent="center">
                        <!-- unit -->
                        <Label
                            :text="currentCalibration.unit"
                            verticalAlignment="bottom"
                            class="m-r-5 m-t-5 size-14"
                            :opacity="currentCalibration.key == 'ph' ? 1 : 0"
                        />
                        <!-- reading -->
                        <Label
                            flexShrink="0.25"
                            :text="currentReading"
                            verticalAlignment="bottom"
                            class="size-26"
                        />
                        <!-- unit -->
                        <Label
                            :text="currentCalibration.unit"
                            verticalAlignment="bottom"
                            class="m-l-5 m-t-5 size-14"
                            :opacity="currentCalibration.key == 'ph' ? 0 : 1"
                        />
                    </FlexboxLayout>
                </GridLayout>
                <!-- timer -->
                <StackLayout row="1">
                    <Label
                        class="size-20 elapsed-time elapsed-time-top"
                        :text="elapsedTime"
                    ></Label>
                    <Label
                        class="size-14 elapsed-time"
                        :text="elapsedTimeLabel"
                    ></Label>
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
        </GridLayout>
    </Page>
</template>

<script>
import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import routes from "../routes";
import Services from "../services/services";

const dbInterface = Services.Database();

export default {
    props: ["calibrationType", "station"],
    data() {
        return {
            step: -1,
            title: "Set Up",
            instruction: "",
            instructionHeading: "",
            buttonText: "Next",
            displayImage: null,
            percentDone: 0,
            nextEnabled: true,
            currentStation: {},
            currentCalibration: {},
            currentReading: "--",
            timerRunning: false,
            elapsedTime: "--:--",
            elapsedTimeLabel: "min sec"
        };
    },
    components: {},
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            this.colorCircle = this.page.getViewById("color-circle");

            // TEMP temp not getting station or id in params just yet
            this.paramId = 1;
            this.getFromDatabase();

            if (this.calibrationType) {
                // select calibration type
            } else {
                this.currentCalibration = calibrations.ph;
            }
            this.goNext();
        },

        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            const steps = this.currentCalibration.steps;
            if (this.step > 0) {
                this.step -= 1;
                this.percentDone = (this.step / steps.length) * 100;
                this.displayImage = steps[this.step].image;
                this.instructionHeading = steps[this.step].heading;
                this.instruction = steps[this.step].instruction;
                this.buttonText = steps[this.step].buttonText;
                // reset timer things
                this.nextEnabled = true;
                this.timerRunning = false;
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
            }
        },

        goNext() {
            const steps = this.currentCalibration.steps;
            if (this.step < steps.length - 1) {
                this.step += 1;
                this.percentDone = (this.step / steps.length) * 100;
                this.displayImage = steps[this.step].image;
                this.instructionHeading = steps[this.step].heading;
                this.instruction = steps[this.step].instruction;
                this.buttonText = steps[this.step].buttonText;
                if (steps[this.step].isTimer) {
                    this.nextEnabled = false;
                    this.timerRunning = true;
                    this.stopTime = steps[this.step].time;
                    this.startTimer();
                }
            }
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
            return Promise.all(
                this.currentStation.moduleObjects.map(this.getSensors)
            );
        },

        completeSetup() {
            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
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
                const readings = this.$stationMonitor.getStationReadings(
                    this.currentStation
                );
                if (readings) {
                     this.updateCurrentReadings(readings);
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
                        const reading = readings[m.name + s.name];
                        if (reading || reading === 0) {
                            this.currentReading = +reading.toFixed(2);
                        }
                    }
                });
            });
        },

        startTimer() {
            this.started = Date.now();
            this.elapsedTime = "00:00";
            this.timerInterval = setInterval(this.updateTimer, 500);

            this.colorCircle.rotate = 0;
            this.colorCircle
                .animate({
                    rotate: 360,
                    duration: this.stopTime
                });
        },

        updateTimer() {
            const elapsed = Date.now() - this.started;
            if (elapsed > this.stopTime) {
                clearInterval(this.timerInterval);
                this.nextEnabled = true;
            }

            let seconds = Math.floor((elapsed / 1000) % 60);
            seconds = seconds < 10 ? "0" + seconds : seconds;
            let minutes = Math.floor((elapsed / (1000 * 60)) % 60);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            this.elapsedTime = minutes + ":" + seconds;
        },

        skip() {
            this.$navigateTo(routes.stations);
        }
    }
};

const calibrations = {
    ph: {
        key: "ph",
        unit: "pH",
        title: "Water pH",
        icon: "~/images/Icon_WaterpH_Module.png",
        steps: [
            {
                heading: "Quick pH Calibration",
                instruction: "Make sure you have your quick calibration pH solution.",
                image: "~/images/TI_11.jpg",
                buttonText: "Next"
            },
            {
                heading: "Quick pH Calibration",
                instruction: "Rinse probe off with de-ionized water.",
                image: "~/images/TI_12-A.jpg",
                buttonText: "Next"
            },
            {
                heading: "Quick pH Calibration",
                instruction: "Place probe inside cup with solution and let the readings stabilize. Make sure water temperature is also inside solution.",
                image: "~/images/TI_13-B.jpg",
                buttonText: "Start Timer"
            },
            {
                isTimer: true,
                time: 120000,
                heading: "Quick pH Calibration",
                instruction: "",
                image: null,
                buttonText: "Calibrate"
            }
        ]
    },
    do: {
        key: "do",
        unit: "mg/L",
        title: "Water Dissolved Oxygen",
        icon: "~/images/Icon_DissolvedOxygen_Module.png",
        steps: [1,2]
    },
    ec: {
        key: "ec",
        unit: "μS",
        title: "Water Electrical Conductivity",
        icon: "~/images/Icon_WaterConductivity_Module.png",
        steps: [1,2]
    },
};


</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
.page {
    color: $fk-primary-black;
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
    margin-bottom: 20;
}
.instruction {
    font-size: 16;
}
.illo {
    margin: 20;
}
.timer-container {
    margin-top: 120;
    text-align: center;
}

#background-circle,
#color-circle,
#inner-circle {
    border-radius: 100;
}
#color-circle {
    width: 200;
    height: 200;
    background-color: $fk-primary-blue;
    clip-path: circle(20% at 0 50%);
}
#background-circle {
    width: 200;
    height: 200;
    background-color: $fk-gray-white;
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

</style>
