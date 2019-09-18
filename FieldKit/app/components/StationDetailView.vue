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

                <ModuleListView ref="moduleList" @moduleTapped="goToModule" />

                <!-- footer -->
                <StationFooterTabs :station="station" active="station" />

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
import ModuleListView from './ModuleListView';
import StationFooterTabs from './StationFooterTabs';

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
            modules: []
        };
    },
    components: {
        StationStatusBox,
        ModuleListView,
        StationFooterTabs
    },
    props: ["stationId", "station"],
    methods: {
        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.stopProcesses();

            this.$navigateTo(routes.stations);
        },

        goToDeploy(event) {
            this.stopProcesses();

            this.$navigateTo(routes.deployMap, {
                props: {
                    station: this.station
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
                    station: this.station
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

            if(this.stationId) {
                dbInterface
                    .getStation(this.stationId)
                    .then(this.getModules)
                    .then(this.setupModules)
                    .then(this.completeSetup);
            } else {
                this.stationId = this.station.id;
                this.completeSetup();
            }
        },

        respondToUpdates() {
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
                        this.$refs.moduleList.updateReadings(data.value.readings);
                    }
                    break;
                }
                }
            }, error => {
                // console.log("propertyChangeEvent error", error);
            });
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
            this.$refs.moduleList.updateModules(this.station.moduleObjects);
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
                        this.station.portal_id = stationPortalId;
                        dbInterface.setStationPortalID(this.station);
                    });
            }

            // start getting live readings for this station
            if(this.station.url != "no_url") {
                this.$stationMonitor.startLiveReadings(this.station.url);
            }

            // now that station and modules are defined, respond to updates
            this.respondToUpdates();

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
</style>
