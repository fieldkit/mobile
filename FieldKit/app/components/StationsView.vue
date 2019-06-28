<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout id="stations-list">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout";
    import { Label } from "tns-core-modules/ui/label/label";
    import StationDetail from "./StationDetailView";
    import StationData from "../services/station-data";
    const stationData = new StationData();

    export default {
        data() {
            return {
                message: "FieldKit Stations",
                stations: null
            };
        },
        methods: {
            onPageLoaded(args) {
                this.page = args.object;
                if(!this.stations) {
                    stationData.getAll().then(result => {
                        this.stations = result;
                        this.createStationElements();
                    }, error => {
                        // console.log("error getting stations data", error)
                    });
                }
            },

            goToDetail(event) {
                this.$navigateTo(StationDetail, {
                    props: {
                        // remove the "station-" prefix
                        stationId: event.object.id.split("station-")[1]
                    }
                });
            },

            createStationElements() {
                let layout = this.page.getViewById("stations-list");

                if(this.stations.length == 0) {
                    let noneLabel = new Label();
                    noneLabel.text = "No stations found.";
                    noneLabel.className = "m-10 p-10 text-center";
                    noneLabel.style = "font-size: 20;";
                    layout.addChild(noneLabel);
                    return
                }

                // define here in order to reference in loop
                let detailNav = this.goToDetail;

                this.stations.forEach(function(r,i) {
                    let stationStack = new StackLayout();
                    stationStack.id = "station-"+r.device_id;
                    stationStack.orientation = "vertical";
                    stationStack.className = "station-container m-y-5 m-x-15 p-10";
                    stationStack.on("tap", detailNav)

                    let nameLabel = new Label();
                    nameLabel.text = r.name;
                    nameLabel.className = "station-name";
                    stationStack.addChild(nameLabel);
                    let statusLabel = new Label();
                    statusLabel.text = r.status;
                    statusLabel.className = "stations-list " + (r.status ? r.status.replace(/ /g, '') : '');
                    stationStack.addChild(statusLabel);

                    layout.addChild(stationStack);
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
</style>
