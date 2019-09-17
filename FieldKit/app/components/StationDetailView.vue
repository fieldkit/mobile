<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="*">
                    <StackLayout row="0" class="round m-y-10" @tap="goBack" horizontalAlignment="left">
                        <Image
                            width="21"
                            class="m-t-10"
                            v-show="!isEditingName"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="left"
                        v-show="isEditingName"
                        @tap="cancelRename"
                        src="~/images/Icon_Close.png"></Image>
                    <Label
                        row="0"
                        class="title m-y-20 text-center station-name"
                        :text="station.name"
                        v-show="!isEditingName"
                        textWrap="true"></Label>
                    <!-- Edit name form -->
                    <StackLayout row="0" id="station-name-field" class="input-field m-y-20 text-left">
                        <FlexboxLayout>
                            <TextField
                                class="input"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                horizontalAlignment="left"
                                v-model="station.name"
                                v-show="isEditingName"
                                returnKeyType="next"
                                @blur="checkName"></TextField>
                            <Label
                                class="size-10 char-count"
                                horizontalAlignment="right"
                                :text="station.name.length"
                                v-show="isEditingName"></Label>
                        </FlexboxLayout>
                        <StackLayout class="spacer-top" id="name-field-spacer"></StackLayout>
                        <Label
                            class="validation-error"
                            id="no-name"
                            horizontalAlignment="left"
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            horizontalAlignment="left"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            horizontalAlignment="left"
                            :text="_L('nameNotPrintable')"
                            textWrap="true"
                            :visibility="nameNotPrintable ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                    <!-- end edit name form -->
                    <Image
                        row="0"
                        class="m-10"
                        width="14"
                        horizontalAlignment="right"
                        v-show="!isEditingName"
                        @tap="toggleRename"
                        src="~/images/Icon_Edit.png"></Image>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="right"
                        v-show="isEditingName"
                        @tap="saveStationName"
                        src="~/images/Icon_Save.png"></Image>
                </GridLayout>

                <StationStatusBox ref="statusBox" @deployTapped="goToDeploy" />

                <StackLayout id="station-detail">
                    <GridLayout :id="'m_id-' + m.id"
                        rows="auto" columns="*"
                        v-for="(m, moduleIndex) in modules"
                        :key="m.id"
                        class="module-container m-10 p-10"
                        :automationText="'moduleLink' + moduleIndex"
                        @tap="goToModule">
                        <Image width="40"
                            horizontalAlignment="left"
                            :src="(m.name.indexOf('Water') > -1 ? '~/images/Icon_Water_Module.png' :
                                m.name.indexOf('Weather') > -1 ? '~/images/Icon_Weather_Module.png' :
                                '~/images/Icon_Generic_Module.png')"></Image>
                        <StackLayout orientation="vertical" class="module-labels">
                            <Label :text="m.name" class="module-name size-16" />
                            <Label :id="'sensor-label-' + m.id"
                                :text="m.currentSensorLabel"
                                class="sensor-name size-14" />
                        </StackLayout>

                        <template v-if="m.name.indexOf('Generic') > -1 ">
                            <Image width="30"
                                src="~/images/Icon_Congfigure.png"
                                horizontalAlignment="right"></Image>
                        </template>
                        <template v-else>
                            <!-- current reading, with trend arrow and units -->
                            <StackLayout :id="'sensors-of-' + m.id"
                                horizontalAlignment="right"
                                verticalAlignment="center"
                                orientation="vertical"
                                class="sensor-labels">
                                <GridLayout rows="auto" columns="auto, auto">
                                    <Image col="0"
                                        width="7"
                                        class="m-r-2"
                                        :src="m.currentSensorTrend"></Image>
                                    <Label col="1"
                                        :text="m.currentSensorReading"
                                        class="size-24" />
                                </GridLayout>
                                <Label :text="m.currentSensorUnit"
                                    class="size-10 text-right" />
                            </StackLayout>
                        </template>
                    </GridLayout>
                </StackLayout>

                <!-- footer -->
                <FlexboxLayout justifyContent="space-between"
                    class="size-12 p-30 footer">
                    <StackLayout class="footer-btn">
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout @tap="goToData" class="footer-btn">
                        <Image width="20" src="~/images/Icon_Data_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('data')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('settings')"></Label>
                    </StackLayout>
                </FlexboxLayout>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import routes from "../routes";
import Services from '../services/services';
import Config from '../config';
import StationStatusBox from './StationStatusBox';

const log = Config.logger('StationDetailView');

const dbInterface = Services.Database();
const stateManager = Services.StateManager();

export default {
    data() {
        return {
            isEditingName: false,
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
            station: {
                name: "FieldKit Station",
                connected: 0,
                battery: "0",
                battery_image: "~/images/Icon_Battery.png",
                available_memory: "0",
                origName: "FieldKit Station"
            },
            modules: []
        };
    },
    components: {
        StationStatusBox
    },
    props: ["stationId", "recording"],
    methods: {
        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.stopProcesses();

            this.$navigateTo(routes.stations, {
                props: {
                    stationId: this.stationId,
                    recording: this.recording
                }
            });
        },

        goToData(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.stopProcesses();

            this.$navigateTo(routes.dataDownload, {
                props: {
                    stationId: this.stationId,
                    url: this.station.url,
                    stationName: this.station.name
                }
            });
        },

        goToDeploy(event) {
            this.stopProcesses();

            this.$navigateTo(routes.deployMap, {
                props: {
                    stationId: this.stationId
                }
            });
        },

        goToModule(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.stopProcesses();

            this.$navigateTo(routes.module, {
                props: {
                    // remove the "m_id-" prefix
                    moduleId: event.object.id.split("m_id-")[1],
                    stationId: this.stationId,
                    url: this.station.url
                }
            });
        },

        stopProcesses() {
            if (this.station && this.station.url != "no_url") {
                this.$stationMonitor.stopLiveReadings(this.station.url);
            }
            clearInterval(this.intervalTimer);
        },

        onPageLoaded(args) {
            this.page = args.object;

            this.user = this.$portalInterface.getCurrentUser();

            const saved = this.$stationMonitor.sortStations().filter(s => s.id == this.stationId);
            if (saved.length > 0) {
                this.station.connected = saved[0].connected;
            }

            this.$stationMonitor.on(Observable.propertyChangeEvent, data => {
                switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationRefreshedProperty: {
                    if (!data.value || !this.station) {
                        console.log('bad station refresh', data);
                    }
                    else {
                        if (Number(data.value.id) === Number(this.stationId)) {
                            this.station.connected = data.value.connected;
                        }
                    }
                    break;
                }
                case this.$stationMonitor.ReadingsChangedProperty: {
                    if (data.value.stationId == this.stationId) {
                        this.$refs.statusBox.updateStatus(data.value);
                        this.cycleSensorReadings(data.value.readings);
                    }
                    break;
                }
                }
            }, error => {
                // console.log("propertyChangeEvent error", error);
            });

            dbInterface
                .getStation(this.stationId)
                .then(this.getModules)
                .then(this.setupModules)
                .then(this.completeSetup);
        },

        toggleRename() {
            this.isEditingName = true;
        },

        checkName() {
            // reset these first
            this.noName = false;
            this.nameNotPrintable = false;

            this.nameTooLong = false;
            // then check
            this.noName = !this.station.name || this.station.name.length == 0;
            if (this.noName) {
                return false;
            }
            let matches = this.station.name.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.station.name.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },

        saveStationName() {
            this.isEditingName = false;
            let valid = this.checkName();
            if (valid && this.station.origName != this.station.name) {
                stateManager.renameStation(this.station, this.station.name).then(() => {
                    this.station.origName = this.station.name;
                }).catch((error) => {
                    console.error('unhandled error', error);
                });
                /*
                NOTE:  Left for the moment. I think we'll have to come back and do the fancy config tracking later.
                let configChange = {
                    station_id: this.station.id,
                    before: this.station.origName,
                    after: this.station.name,
                    affected_field: "name",
                    author: this.user.name
                }
                dbInterface.recordStationConfigChange(configChange);
                */
            }
        },

        cancelRename() {
            this.isEditingName = false;
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            this.station.name = this.station.origName;
        },

        getModules(station) {
            this.station = station[0];
            return dbInterface.getModules(this.station.id);
        },

        linkModulesAndSensors(results) {
            results.forEach(r => {
                r.resultPromise.then(sensors => {
                    r.module.sensorObjects = sensors;
                    // set variables for cycling sensors
                    r.module.sensorIndex = 0;
                    r.module.currentSensorLabel = sensors[0].name;
                    r.module.currentSensorReading = sensors[0].current_reading ?
                        sensors[0].current_reading.toFixed(1) : "--";
                    r.module.currentSensorUnit = sensors[0].unit;
                    r.module.currentSensorTrend = "~/images/Icon_Neutral.png";
                });
            });
        },

        getSensors(moduleObject) {
            let result = dbInterface.getSensors(moduleObject.id);
            return { resultPromise: result, module: moduleObject };
        },

        setupModules(modules) {
            this.station.moduleObjects = modules;
            return Promise.all(this.station.moduleObjects.map(this.getSensors)).then(
                this.linkModulesAndSensors
            );
        },

        completeSetup() {
            this.$refs.statusBox.updateStation(this.station);
            this.modules = this.station.moduleObjects;
            this.station.origName = this.station.name;

            // add this station to portal if hasn't already been added
            // note: currently the tables are always dropped and re-created,
            // so stations will not retain these saved portal_ids
            if (!this.station.portal_id && this.station.url != "no_url") {
                let params = {
                    name: this.station.name,
                    device_id: this.station.device_id,
                    status_json: this.station
                };
                this.$portalInterface
                    .addStation(params)
                    .then(stationPortalId => {
                        this.station.portalId = stationPortalId;
                        dbInterface.setStationPortalID(this.station);
                    });
            }

            // cycle readings on seeded stations (for now)
            if(this.station.url != "no_url") {
                this.$stationMonitor.startLiveReadings(this.station.url);
            } else {
                this.intervalTimer = setInterval(this.cycleSensorReadings, 5000);
            }
        },

        cycleSensorReadings(liveReadings) {
            let page = this.page;
            this.station.moduleObjects.forEach(m => {
                // ignore single sensor modules that don't have live readings
                if (m.sensorObjects.length == 1 && !liveReadings) {
                    return;
                }

                // increment to cycle through sensors
                m.sensorIndex = m.sensorIndex == m.sensorObjects.length - 1 ? 0 : m.sensorIndex + 1;
                let currentSensor = m.sensorObjects[m.sensorIndex];

                let newReading = currentSensor.current_reading ?
                    +currentSensor.current_reading.toFixed(1) : 0;
                let prevReading = currentSensor.current_reading ?
                    +currentSensor.current_reading.toFixed(1) : 0;

                if (liveReadings && liveReadings[m.name + currentSensor.name]) {
                    newReading = +liveReadings[m.name + currentSensor.name].toFixed(1);
                    currentSensor.current_reading = newReading;
                    dbInterface.setCurrentReading(currentSensor);
                }

                let trendIcon = "Icon_Neutral.png";
                if (newReading < prevReading) {
                    trendIcon = "Icon_Decrease.png";
                } else if (newReading > prevReading) {
                    trendIcon = "Icon_Increase.png";
                }

                let sensorLabel = page.getViewById("sensor-label-" + m.id);
                if (sensorLabel) {
                    sensorLabel
                        .animate({
                            opacity: 0,
                            duration: 1000
                        })
                        .then(() => {
                            m.currentSensorLabel = currentSensor.name;
                            return sensorLabel.animate({
                                opacity: 1,
                                duration: 500
                            });
                    });
                }
                let stack = page.getViewById("sensors-of-" + m.id);
                if (stack) {
                    stack
                        .animate({
                            opacity: 0,
                            duration: 1000
                        })
                        .then(() => {
                            m.currentSensorReading = newReading;
                            m.currentSensorUnit = currentSensor.unit;
                            m.currentSensorTrend = "~/images/" + trendIcon;
                            return stack.animate({
                                opacity: 1,
                                duration: 500
                            });
                    });
                }
            });
        },

        onNavigatingFrom() {
            this.stopProcesses();
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
#station-name-field {
    width: 225;
    font-size: 16;
    color: $fk-primary-black;
}

#station-name-field .input {
    width: 195;
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
    padding-top: 3;
    padding-bottom: 2;
    padding-left: 0;
    padding-right: 0;
    margin: 0;
}

#station-name-field .char-count {
    width: 25;
    margin-top: 15;
    margin-left: 5;
}

.station-name {
    width: 195;
}

.validation-error {
    width: 195;
    font-size: 12;
    color: $fk-tertiary-red;
    border-top-color: $fk-tertiary-red;
    border-top-width: 2;
    padding-top: 5;
}

.round {
    width: 40;
    border-radius: 20;
}

.faded {
    opacity: 0.5;
}

.module-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.module-labels {
    margin-left: 50;
}

.sensor-name {
    font-family: "Avenir LT Pro", "AvenirLTPro-Book";
}
</style>
