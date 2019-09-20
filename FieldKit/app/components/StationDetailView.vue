<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                <GridLayout rows="auto" columns="15*,70*,15*">
                    <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <GridLayout col="1" rows="auto,auto" columns="*">
                        <Label row="0"
                            class="title m-t-10 text-center"
                            :text="station.name"
                            textWrap="true"></Label>
                        <Label row="1"
                            class="text-center size-12"
                            :text="deployedStatus"
                            textWrap="true"></Label>
                    </GridLayout>
                    <StackLayout col="2" class="round-bkgd" @tap="goToSettings">
                        <Image
                            width="25"
                            src="~/images/Icon_Congfigure.png"></Image>
                    </StackLayout>
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

export default {
    data() {
        return {
            deployedStatus: "Ready to deploy",
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

            this.$navigateTo(routes.stations, {
                props: {
                    station: this.station
                }
            });
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

        goToSettings(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.stopProcesses();

            this.$navigateTo(routes.stationSettings, {
                props: {
                    station: this.station
                }
            });
        },

        stopProcesses() {
            if (this.station && this.station.url != "no_url") {
                this.$stationMonitor.stopLiveReadings(this.station.url);
            }
            this.$refs.statusBox.stopProcesses();
        },

        onPageLoaded(args) {
            this.page = args.object;

            this.user = this.$portalInterface.getCurrentUser();

            if(this.station.name == "") {
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
            if(this.station.deploy_start_time && typeof this.station.deploy_start_time == "string") {
                this.station.deploy_start_time = new Date(this.station.deploy_start_time);
            }
            if(this.station.status == "recording") {this.setDeployedStatus();}
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
                // see if live readings have been stored already
                const readings = this.$stationMonitor.getStationReadings(this.station);
                if(readings) {
                    this.$refs.moduleList.updateReadings(readings);
                }
                this.$stationMonitor.startLiveReadings(this.station.url);
            }

            // now that station and modules are defined, respond to updates
            this.respondToUpdates();

        },

        setDeployedStatus() {
            if(!this.station.deploy_start_time) {
                this.deployedStatus = "Deployed";
                return
            }
            let month = this.station.deploy_start_time.getMonth() + 1;
            let day = this.station.deploy_start_time.getDate();
            let year = this.station.deploy_start_time.getFullYear();
            this.deployedStatus = "Deployed (" + month + "/" + day + "/" + year + ")";
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

</style>
