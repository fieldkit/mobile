<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout id="stations-list">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>
                <Label v-if="stations.length == 0" :text="_L('noStations')" class="m-10 p-10 text-center size-20" />
                <StackLayout v-for="s in stations" orientation="vertical" :key="s.device_id" :id="'station-'+s.device_id" class="station-container m-y-5 m-x-15 p-10" @tap=goToDetail>
                    <Label :text="s.name" class="station-name" />
                    <Label :text="s.status" :class="'stations-list '+(s.status ? s.status.replace(/ /g, '') : '')" />
                </StackLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout";
    import { Label } from "tns-core-modules/ui/label/label";
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";
    const dbInterface = new DatabaseInterface();

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
                if(this.stations.length == 0) {
                    dbInterface.getAll().then(result => {
                        this.stations = result;
                    }, error => {
                        // console.log("error getting stations data", error)
                    });
                }
            },

            goToDetail(event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";

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
    .stations-list {font-size: 16;}
    .Readytodeploy {color: green}
</style>
