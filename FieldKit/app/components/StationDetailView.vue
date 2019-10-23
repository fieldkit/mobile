<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <ScreenHeader :title="activeStation.name" :subtitle="deployedStatus" :onBack="goBack" :onSettings="goToSettings" />

                    <GridLayout rows="auto" columns="*" v-if="loading" class="text-center">
                        <StackLayout id="loading-circle-blue"></StackLayout>
                        <StackLayout id="loading-circle-white"></StackLayout>
                    </GridLayout>

                    <StationStatusBox ref="statusBox" @deployTapped="goToDeploy" />

                    <ModuleListView ref="moduleList" @moduleTapped="goToModule" />
                </FlexboxLayout>
            </ScrollView>

            <!-- footer -->
            <StationFooterTabs row="1" :station="activeStation" active="station" />
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
import Config from "../config";
import StationStatusBox from "./StationStatusBox";
import ModuleListView from "./ModuleListView";
import ScreenHeader from "./ScreenHeader";
import StationFooterTabs from "./StationFooterTabs";

const log = Config.logger("StationDetailView");

const dbInterface = Services.Database();

export default {
    data() {
        return {
            loading: true,
            deployedStatus: "Ready to deploy",
            modules: [],
            activeStation: { name: "", id: 0 },
            paramId: null
        };
    },
    components: {
        ScreenHeader,
        StationStatusBox,
        ModuleListView,
        StationFooterTabs
    },
    props: {
        stationId: {
            type: String,
        },
        station: {
            type: Object,
        }
    },
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
                    station: this.activeStation
                }
            });
        },

        goToDeploy(event) {
            this.stopProcesses();

            this.$navigateTo(routes.deployMap, {
                props: {
                    station: this.activeStation
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
                    station: this.activeStation
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
                    station: this.activeStation
                }
            });
        },

        stopProcesses() {
            if (this.activeStation && this.activeStation.url != "no_url") {
                this.$stationMonitor.stopLiveReadings(this.activeStation.url);
            }
            clearInterval(this.intervalTimer);
            this.$refs.statusBox.stopProcesses();
        },

        onPageLoaded(args) {
            this.page = args.object;

            this.user = this.$portalInterface.getCurrentUser();

            this.loadingBlue = this.page.getViewById("loading-circle-blue");
            this.loadingWhite = this.page.getViewById("loading-circle-white");
            this.intervalTimer = setInterval(this.showLoadingAnimation, 1000);

            if (this.station) {
                this.activeStation = this.station;
                this.paramId = this.activeStation.id;
                this.completeSetup();
            } else {
                this.paramId = this.stationId;
                this.getFromDatabase();
            }
        },

        getFromDatabase() {
            dbInterface
                .getStation(this.paramId)
                .then(this.getModules)
                .then(this.setupModules)
                .then(this.completeSetup);
        },

        respondToUpdates() {
            const saved = this.$stationMonitor
                .sortStations()
                .filter(s => s.id == this.paramId);
            if (saved.length > 0) {
                this.activeStation.connected = saved[0].connected;
            }

            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
                data => {
                    switch (data.propertyName.toString()) {
                        case this.$stationMonitor.StationRefreshedProperty: {
                            if (!data.value || !this.activeStation) {
                                console.log("bad station refresh", data.value);
                            } else {
                                if (
                                    Number(data.value.id) ===
                                    Number(this.paramId)
                                ) {
                                    this.activeStation.connected =
                                        data.value.connected;
                                }
                            }
                            break;
                        }
                        case this.$stationMonitor.ReadingsChangedProperty: {
                            if (data.value.stationId == this.paramId) {
                                this.$refs.statusBox.updateStatus(data.value);
                                this.$refs.moduleList.updateReadings(
                                    data.value.readings
                                );
                            }
                            break;
                        }
                    }
                },
                error => {
                    // console.log("propertyChangeEvent error", error);
                }
            );
        },

        getModules(stations) {
            if (stations.length == 0) {
                // adding to db in background hasn't finished yet,
                // wait a few seconds and try again
                setTimeout(this.getFromDatabase, 2000);
                return Promise.reject();
            }
            this.activeStation = stations[0];
            return dbInterface.getModules(this.activeStation.id);
        },

        getSensors(moduleObject) {
            return dbInterface.getSensors(moduleObject.id).then(sensors => {
                moduleObject.sensorObjects = sensors;
            });
        },

        setupModules(modules) {
            this.activeStation.moduleObjects = modules;
            return Promise.all(this.activeStation.moduleObjects.map(this.getSensors));
        },

        completeSetup() {
            this.loading = false;
            clearInterval(this.intervalTimer);
            if (
                this.activeStation.deployStartTime &&
                typeof this.activeStation.deployStartTime == "string"
            ) {
                this.activeStation.deployStartTime = new Date(
                    this.activeStation.deployStartTime
                );
            }
            if (this.activeStation.status == "recording") {
                this.setDeployedStatus();
            }
            this.$refs.statusBox.updateStation(this.activeStation);
            this.$refs.moduleList.updateModules(this.activeStation.moduleObjects);
            this.activeStation.origName = this.activeStation.name;
            // add this station to portal if hasn't already been added
            // note: currently the tables are always dropped and re-created,
            // so stations will not retain these saved portalIds
            let params = {
                name: this.activeStation.name,
                device_id: this.activeStation.deviceId,
                status_json: this.activeStation
            };
            if (!this.activeStation.portalId && this.activeStation.url != "no_url") {
                this.$portalInterface
                    .addStation(params)
                    .then(stationPortalId => {
                        this.activeStation.portalId = stationPortalId;
                        dbInterface.setStationPortalID(this.activeStation);
                    });
            } else if (this.activeStation.portalId && this.activeStation.url != "no_url") {
                this.$portalInterface
                    .updateStation(params, this.activeStation.portalId)
                    .then(stationPortalId => {
                        // console.log("successfully updated", stationPortalId)
                    });
            }

            // start getting live readings for this station
            if (this.activeStation.url != "no_url") {
                // see if live readings have been stored already
                const readings = this.$stationMonitor.getStationReadings(
                    this.activeStation
                );
                if (readings) {
                    this.$refs.moduleList.updateReadings(readings);
                }
                this.$stationMonitor.startLiveReadings(this.activeStation.url);
            }

            // now that activeStation and modules are defined, respond to updates
            this.respondToUpdates();
        },

        setDeployedStatus() {
            if (!this.activeStation.deployStartTime) {
                this.deployedStatus = "Deployed";
                return;
            }
            let month = this.activeStation.deployStartTime.getMonth() + 1;
            let day = this.activeStation.deployStartTime.getDate();
            let year = this.activeStation.deployStartTime.getFullYear();
            this.deployedStatus =
                "Deployed (" + month + "/" + day + "/" + year + ")";
        },

        onNavigatingFrom() {
            this.stopProcesses();
        },

        showLoadingAnimation() {
            this.loadingWhite
                .animate({
                    rotate: 360,
                    duration: 975
                })
                .then(() => {
                    this.loadingWhite.rotate = 0;
                });
        }
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
</style>
