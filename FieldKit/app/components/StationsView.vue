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
    import StationStatus from "../services/station-status";
    const stationStatus = new StationStatus();

    export default {
        data() {
            return {
                message: "FieldKit Stations"
            };
        },
        methods: {
            onPageLoaded(args) {
                this.page = args.object;
                stationStatus.getAll().then(result => {
                    this.createStationElements(result);
                }, error => {
                    // console.log("error getting stations data", error)
                });
            },

            createStationElements(stations) {
                var layout = this.page.getViewById("stations-list");

                if(stations.length == 0) {
                    var noneLabel = new Label();
                    noneLabel.text = "No stations found.";
                    noneLabel.className = "m-10 p-10 text-center";
                    noneLabel.style = "font-size: 20;";
                    layout.addChild(noneLabel);
                    return
                }

                stations.forEach(function(r,i) {
                    var stationStack = new StackLayout();
                    stationStack.orientation = "vertical";
                    stationStack.className = "station-container m-y-5 m-x-15 p-10";

                    var nameLabel = new Label();
                    nameLabel.text = r.name;
                    nameLabel.className = "station-name";
                    stationStack.addChild(nameLabel);
                    var statusLabel = new Label();
                    statusLabel.text = r.status;
                    statusLabel.className = "station-status " + r.status.replace(/ /g, '');
                    stationStack.addChild(statusLabel);

                    layout.addChild(stationStack);
                });
                // custom styles are not picked up if defined before element added
                // (but there must be a way?)
                this.page.addCss(
                    ".station-container { \
                        border-radius: 4; \
                        border-color: gray; \
                        border-width: 1;}"
                );
                this.page.addCss(".station-name {font-size: 18; color: black;}");
                this.page.addCss(".station-status {font-size: 16;}");
                this.page.addCss(".Readytodeploy {color: green}");
                this.page.addCss(".Deployed {color: black}");
                this.page.addCss(".Configuresensor {color: gray}");
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
