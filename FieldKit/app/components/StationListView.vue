<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout id="stations-list" class="m-y-10">
                <StackLayout row="0" class="round m-x-10" @tap="goBack" horizontalAlignment="left">
                    <Image
                        width="21"
                        class="m-y-10"
                        src="~/images/Icon_backarrow.png"></Image>
                </StackLayout>
                <Label class="h2 m-y-10 text-center" :text="message" textWrap="true"></Label>
                <Label v-if="stations.length == 0"
                    :text="_L('noStations')"
                    class="m-10 p-10 text-center size-20" />
                <StackLayout v-for="s in stations"
                    :key="s.sortedIndex"
                    :id="'station-'+s.id"
                    class="station-container m-y-5 m-x-15 p-10"
                    orientation="vertical"
                    @tap=goToDetail>
                    <Label :text="s.name" :class="'station-name ' + (s.connected == 0 ? 'disconnected' : '')" />
                    <Label v-if="s.connected"
                        :text="s.status == 'recording' ? _L('recording') : _L('connected')"
                        :class="'stations-list '+(s.status ? s.status : 'connected')" />
                </StackLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
import routes from "../routes";
import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";

export default {
    data() {
        return {
            message: "FieldKit Stations",
            stations: []
        };
    },
    props: [],
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.stations = this.$stationMonitor.getStations();

            this.$stationMonitor.on(Observable.propertyChangeEvent, this.updateStations);
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

            this.$navigateTo(routes.stationDetail, {
                props: {
                    // remove the "station-" prefix
                    stationId: event.object.id.split("station-")[1],
                    // necessary to have station defined on page load
                    station: {name: ""}
                }
            });
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
// End custom common variables

// Custom styles
.round {
    width: 40;
    border-radius: 20;
}
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
.stations-list {font-size: 16;}
.recording {color: $fk-primary-blue;}
.connected, .idle {color: $fk-tertiary-green;}
</style>
