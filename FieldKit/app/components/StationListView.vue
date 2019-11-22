<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <StackLayout id="stations-list" class="m-y-10">
                    <ScreenHeader
                        title="FieldKit Stations"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                    />
                    <Label
                        v-if="stations.length == 0"
                        :text="_L('lookingForStations')"
                        class="m-10 p-10 text-center size-20"
                    />
                    <StackLayout
                        v-for="s in stations"
                        :key="s.sortedIndex"
                        :id="'station-' + s.id"
                        class="station-container m-y-5 m-x-15 p-10"
                        orientation="vertical"
                        @tap="goToDetail"
                    >
                        <Label
                            :text="s.name"
                            :class="
                                'station-name ' +
                                    (s.connected ? '' : 'disconnected')
                            "
                        />
                        <Label
                            v-if="s.connected"
                            :text="
                                s.status == 'recording'
                                    ? _L('recording')
                                    : _L('connected')
                            "
                            :class="
                                'stations-list ' +
                                    (s.status ? s.status : 'connected')
                            "
                        />
                    </StackLayout>
                </StackLayout>
            </ScrollView>
            <StackLayout horizontalAlignment="right" verticalAlignment="bottom">
                <Label text="dev" class="dev-link" @doubleTap="showDev" />
            </StackLayout>
            <!-- footer -->
            <StationFooterTabs row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";

import ScreenHeader from "./ScreenHeader";
import StationFooterTabs from "./StationFooterTabs";

export default {
    data() {
        return {
            stations: []
        };
    },
    components: {
        ScreenHeader,
        StationFooterTabs
    },
    props: {
        station: Object,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.stations = this.$stationMonitor.getStations();

            this.$stationMonitor.on(
                Observable.propertyChangeEvent,
                this.updateStations
            );
        },

        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);
            this.$navigateTo(routes.home);
        },

        updateStations(data) {
            switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationsUpdatedProperty: {
                    this.stations = data.value;
                    break;
                }
                case this.$stationMonitor.StationRefreshedProperty: {
                    break;
                }
            }
        },

        goToDetail(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            // remove the "station-" prefix
            let id = event.object.id.split("station-")[1];
            let stationObj = null;
            if (this.station && this.station.id == id) {
                stationObj = this.station;
            }

            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: id,
                    station: stationObj
                }
            });
        },

        showDev() {
            dialogs
                .confirm({
                    title: "Do you want to view developer options?",
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel")
                })
                .then(result => {
                    if (result) {
                        this.$navigateTo(routes.home);
                    }
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

.station-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.station-name {
    font-size: 18;
    color: black;
}
.station-name.disconnected {
    color: $fk-gray-dark;
}
.stations-list {
    font-size: 16;
}
.recording {
    color: $fk-primary-blue;
}
.connected,
.idle {
    color: $fk-tertiary-green;
}
.dev-link {
    color: $fk-gray-lightest;
    padding: 10;
}
</style>
