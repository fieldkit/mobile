<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout id="stations-list">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>
                <Label v-if="stations.length == 0"
                    :text="_L('noStations')"
                    class="m-10 p-10 text-center size-20" />
                <StackLayout v-for="s in stations"
                    :key="s.sortedIndex"
                    :id="'station-'+s.id"
                    class="station-container m-y-5 m-x-15 p-10"
                    orientation="vertical"
                    @tap=goToDetail>
                    <Label :text="s.name" :class="'station-name ' + s.connected" />
                    <Label :text="s.status"
                        v-if="s.connected == 'true'"
                        :class="'stations-list '+(s.status ? s.status.replace(/ /g, '') : '')" />
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
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            this.stations = this.$stationMonitor.getStations();
            this.$stationMonitor.on(Observable.propertyChangeEvent, this.updateStations);
        },

        updateStations(data) {
            switch (data.propertyName.toString()) {
                case "stationsChanged": {
                    this.stations = data.value;
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
                    stationId: event.object.id.split("station-")[1]
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
.station-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.station-name {
    font-size: 18;
    color: black;
}
.station-name.false {
    color: $fk-gray-dark;
}
.stations-list {font-size: 16;}
.Readytodeploy {color: green}
</style>
