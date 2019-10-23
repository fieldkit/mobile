<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <ScreenHeader :title="station.name" :subtitle="deployedStatus" :onBack="goBack" :onSettings="goToSettings" />

                    <GridLayout rows="auto" columns="*" v-if="loading" class="text-center">
                        <StackLayout id="loading-circle-blue"></StackLayout>
                        <StackLayout id="loading-circle-white"></StackLayout>
                    </GridLayout>

                    <StationStatusBox ref="statusBox" @deployTapped="goToDeploy" />

                    <ModuleListView ref="moduleList" @moduleTapped="goToModule" />
                </FlexboxLayout>
            </ScrollView>

            <!-- footer -->
            <StationFooterTabs row="1" :station="station" active="station" />
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
            modules: []
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
            clearInterval(this.intervalTimer);
            this.$refs.statusBox.stopProcesses();
        },

        onPageLoaded(args) {
            this.page = args.object;

            this.user = this.$portalInterface.getCurrentUser();

            this.loadingBlue = this.page.getViewById("loading-circle-blue");
            this.loadingWhite = this.page.getViewById("loading-circle-white");
            this.intervalTimer = setInterval(this.showLoadingAnimation, 1000);

            if (this.station.name == "") {
                this.getFromDatabase();
            } else {
                // Vuejs is warning about this, as this gets blown away on a re-render.
                // Need to find sitauations where it's necessary and remove them, defering to station.id.
                this.stationId = this.station.id;
                this.completeSetup();
            }
        },

        getFromDatabase() {
            dbInterface
                .getStation(this.stationId)
                .then(this.getModules)
                .then(this.setupModules)
                .then(this.completeSetup);
        },

        respondToUpdates() {
            const saved = this.$stationMonitor
                .sortStations()
                .filter(s => s.id == this.stationId);
            if (saved.length > 0) {
                this.station.connected = saved[0].connected;
            }

            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
                data => {
                    switch (data.propertyName.toString()) {
                        case this.$stationMonitor.StationRefreshedProperty: {
                            if (!data.value || !this.station) {
                                console.log("bad station refresh", data.value);
                            } else {
                                if (
                                    Number(data.value.id) ===
                                    Number(this.stationId)
                                ) {
                                    this.station.connected =
                                        data.value.connected;
                                }
                            }
                            break;
                        }
                        case this.$stationMonitor.ReadingsChangedProperty: {
                            if (data.value.stationId == this.stationId) {
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

        getModules(station) {
            if (station.length == 0) {
                // adding to db in background hasn't finished yet,
                // wait a few seconds and try again
                setTimeout(this.getFromDatabase, 2000);
                return Promise.reject();
            }
            // Vuejs is warning about this, as this gets blown away on a re-render.
            // Need to find sitauations where it's necessary and remove them, defering to station.id.
            this.station = station[0];
            return dbInterface.getModules(this.station.id);
        },

        getSensors(moduleObject) {
            return dbInterface.getSensors(moduleObject.id).then(sensors => {
                moduleObject.sensorObjects = sensors;
            });
        },

        setupModules(modules) {
            this.station.moduleObjects = modules;
            return Promise.all(this.station.moduleObjects.map(this.getSensors));
        },

        completeSetup() {
            this.loading = false;
            clearInterval(this.intervalTimer);
            if (
                this.station.deployStartTime &&
                typeof this.station.deployStartTime == "string"
            ) {
                this.station.deployStartTime = new Date(
                    this.station.deployStartTime
                );
            }
            if (this.station.status == "recording") {
                this.setDeployedStatus();
            }
            this.$refs.statusBox.updateStation(this.station);
            this.$refs.moduleList.updateModules(this.station.moduleObjects);
            this.station.origName = this.station.name;
            // add this station to portal if hasn't already been added
            // note: currently the tables are always dropped and re-created,
            // so stations will not retain these saved portalIds
            let params = {
                name: this.station.name,
                device_id: this.station.deviceId,
                status_json: this.station
            };
            if (!this.station.portalId && this.station.url != "no_url") {
                this.$portalInterface
                    .addStation(params)
                    .then(stationPortalId => {
                        this.station.portalId = stationPortalId;
                        dbInterface.setStationPortalID(this.station);
                    });
            } else if (this.station.portalId && this.station.url != "no_url") {
                this.$portalInterface
                    .updateStation(params, this.station.portalId)
                    .then(stationPortalId => {
                        // console.log("successfully updated", stationPortalId)
                    });
            }

            // start getting live readings for this station
            if (this.station.url != "no_url") {
                // see if live readings have been stored already
                const readings = this.$stationMonitor.getStationReadings(
                    this.station
                );
                if (readings) {
                    this.$refs.moduleList.updateReadings(readings);
                }
                this.$stationMonitor.startLiveReadings(this.station.url);
            }

            // now that station and modules are defined, respond to updates
            this.respondToUpdates();
        },

        setDeployedStatus() {
            if (!this.station.deployStartTime) {
                this.deployedStatus = "Deployed";
                return;
            }
            let month = this.station.deployStartTime.getMonth() + 1;
            let day = this.station.deployStartTime.getDate();
            let year = this.station.deployStartTime.getFullYear();
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
