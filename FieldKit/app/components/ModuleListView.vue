<template>
    <StackLayout class="m-t-5 m-b-10 m-l-10 m-r-10">
        <GridLayout rows="auto" columns="*" v-for="(m, moduleIndex) in modules" :key="m.id">
            <StackLayout class="bordered-container p-10 m-b-10">
                <!-- top row of module list -->
                <GridLayout rows="auto, auto" columns="15*,70*,15*">
                    <!-- module icon -->
                    <Image rowSpan="2" col="0" width="40" horizontalAlignment="left" :src="getModuleImage(m)"></Image>
                    <!-- module name -->
                    <Label row="0" col="1" :text="getModuleName(m)" class="module-name" textWrap="true" />
                    <!-- calibration status -->
                    <Label
                        row="1"
                        col="1"
                        :text="m.calibrated == 'done' ? 'Calibrated' : 'Uncalibrated'"
                        :class="'size-14 ' + (m.calibrated == 'done' ? 'calibrated' : 'uncalibrated')"
                        @tap="goToCalibration(m)"
                        v-if="m.calibrated != 'NA'"
                    />
                    <!-- toggle sensor container -->
                    <Image
                        rowSpan="2"
                        col="2"
                        verticalAlignment="center"
                        horizontalAlignment="right"
                        :src="open.indexOf(m.id) > -1 ? '~/images/Icon_Cheveron_Up.png' : '~/images/Icon_Cheveron_Down.png'"
                        width="25"
                        :dataId="'m_id-' + m.id"
                        @tap="toggleContainer"
                    ></Image>
                </GridLayout>
                <!-- sensor container -->
                <WrapLayout orientation="horizontal" class="m-t-5" v-if="open.indexOf(m.id) > -1">
                    <Label :text="lastSeen()" width="100%" v-if="!station.connected" class="m-t-5 size-14 hint-color" />
                    <WrapLayout
                        orientation="horizontal"
                        v-for="(s, sensorIndex) in m.sensorObjects"
                        :key="s.id"
                        class="sensor-block"
                        :opacity="station.connected ? 1 : 0.5"
                    >
                        <!-- keep arrows, reading, and unit on same line -->
                        <FlexboxLayout>
                            <!-- trend arrow -->
                            <Image width="7" verticalAlignment="bottom" :src="s.icon" class="trend-icon"></Image>
                            <!-- reading -->
                            <Label flexShrink="0.25" :text="s.displayReading" verticalAlignment="bottom" class="size-24 m-l-2" />
                            <!-- unit -->
                            <Label :text="s.unit" verticalAlignment="bottom" class="unit size-12 m-t-10" />
                        </FlexboxLayout>
                        <!-- name -->
                        <Label :text="getSensorName(m, s)" textWrap="true" class="sensor-name size-14" />
                    </WrapLayout>
                    <!-- view graph link -->
                    <!-- <StackLayout class="link-container text-center">
                        <Label
                            :text="_L('viewGraph')"
                            :id="'m_id-' + m.id"
                            class="view-graph-link text-center"
                            :automationText="'moduleLink' + moduleIndex"
                            @tap="emitModuleTapped"
                        />
                    </StackLayout> -->
                </WrapLayout>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
import routes from "../routes";
import { getLastSeen, _T } from "../utilities"
import Services from "../services/services"
const dbInterface = Services.Database();
const calibrationService = Services.CalibrationService();
const sensorsThatCalibrate = ["ph", "do", "ec"];

export default {
    name: "ModuleListView",
    data: () => {
        return {
            open: [],
            modules: [],
            pending: {}
        }
    },
    props: ["station"],
    methods: {
        goToCalibration(module) {
            if (module.calibrated == "done" || module.calibrated == "NA") {
                return
            }

            // navigate to calibration
            this.$navigateTo(routes.calibration, {
                props: {
                    station: this.station,
                    calibrationType: module.calibrateSensor
                }
            });
        },

        updateModules(modules) {
            this.modules = modules.sort((a, b) => {
                return b.position > a.position ? 1 : b.position < a.position ? -1 : 0
            })
            this.modules.forEach(m => {
                m.calibrated = "NA"
                this.open.push(m.id)
                m.sensorObjects.forEach(s => {
                    this.checkCalibrationStatus(m, s);
                    s.displayReading = s.currentReading ? s.currentReading.toFixed(1) : "--"
                    s.icon = "~/images/Icon_Neutral.png"
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
                const listView = this;
                calibrationService
                    .getCalibrationStatus(this.station.url + "/module/" + m.position)
                    .then(result => {
                        listView.handleCalibrationResult(result, m, s.name);
                    });
            }
        },

        handleCalibrationResult(result, module, sensorName) {
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
            module.calibrated = total > 0 ? "done" : "uncalibrated";
            this.pending[module.position] = false;
        },

        updateReadings(liveReadings) {
            this.modules.forEach(m => {
                let sensors = []
                m.sensorObjects.forEach(s => {
                    this.checkCalibrationStatus(m, s);
                    let trendIcon = "Icon_Neutral.png"
                    if (liveReadings && (liveReadings[m.name + s.name] || liveReadings[m.name + s.name] === 0)) {
                        let prevReading = s.currentReading ? +s.currentReading.toFixed(1) : 0
                        let newReading = +liveReadings[m.name + s.name].toFixed(1)
                        s.currentReading = newReading
                        s.displayReading = newReading
                        dbInterface.setCurrentReading(s)

                        if (newReading < prevReading) {
                            trendIcon = "Icon_Decrease.png"
                        } else if (newReading > prevReading) {
                            trendIcon = "Icon_Increase.png"
                        }
                    }
                    s.icon = "~/images/" + trendIcon
                    sensors.push(s)
                });
                // vue isn't rendering these dynamically, so set them
                this.$set(m, "sensorObjects", sensors)
            });
        },

        lastSeen() {
            if (!this.station || !this.station.updated) {
                return ""
            }
            return "Last reading " + getLastSeen(this.station.updated)
        },

        getModuleName(module) {
            return _T(module.name + ".name");
        },

        getSensorName(module, sensor) {
            return _T(module.name + ".sensors." + sensor.name);
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

        emitModuleTapped(event) {
            this.$emit("moduleTapped", event)
        },

        toggleContainer(event) {
            let id = event.object.dataId.split("m_id-")[1]
            id = parseInt(id)
            let index = this.open.indexOf(id)
            if (index == -1) {
                this.open.push(id)
            } else {
                this.open.splice(index, 1)
            }
        },
    },
}
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
// End custom common variables

// Custom styles
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.module-name {
    font-size: 18;
    // margins set in OS-specific CSS
}

.sensor-block {
    width: 46%;
    padding: 10;
    margin: 5 2%;
    background: $fk-gray-lightest;
}

.trend-icon {
    margin-bottom: 6;
}

.unit {
    margin-left: 2;
    margin-bottom: 3;
}

.sensor-name {
    width: 100%;
    margin-top: 5;
    font-family: 'Avenir LT Pro', 'AvenirLTPro-Book';
}

.link-container {
    width: 100%;
}

.view-graph-link {
    width: 125;
    padding: 5;
    margin: 5;
    text-decoration: underline;
}
.hint-color {
    color: $fk-gray-hint;
}
.calibrated {
    color: $fk-gray-hint;
}
.uncalibrated {
    color: $fk-primary-red;
}
</style>
