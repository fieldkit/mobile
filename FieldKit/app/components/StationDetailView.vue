<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout>
                <GridLayout rows="auto" columns="*">
                    <Image
                        row="0"
                        class="m-10"
                        width="25"
                        horizontalAlignment="left"
                        @tap="goBack"
                        src="~/images/back_arrow.png"></Image>
                    <Label
                        row="0"
                        class="fk-h2 m-y-20 text-center"
                        :text="station.name"
                        textWrap="true"></Label>
                </GridLayout>

                <GridLayout rows="auto" columns="*">
                    <StackLayout
                        row="0"
                        class="col left-col"
                        horizontalAlignment="left">
                        <Label class="text-center" text="Connected"></Label>
                        <Label class="text-center blue" v-show="station.connected">✔</Label>
                        <Label class="text-center red" v-show="!station.connected">✘</Label>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="col right-col"
                        horizontalAlignment="right">
                        <Label class="text-center" text="Battery"></Label>
                        <Label class="text-center blue" :text="station.batteryLevel"></Label>
                    </StackLayout>
                </GridLayout>

                <GridLayout class="memory-bar-container" rows="auto, auto" columns="*">
                    <StackLayout row="0" class="memory-bar"></StackLayout>
                    <StackLayout row="0" class="memory-bar" horizontalAlignment="left" id="station-memory-bar"></StackLayout>
                    <Label row="1" class="m-t-5" horizontalAlignment="left" text="Available Memory"></Label>
                    <Label row="1" class="m-t-5" horizontalAlignment="right" :text="station.availableMemory"></Label>
                </GridLayout>

                <StackLayout id="station-detail"></StackLayout>

                <StackLayout class="module-container m-10 p-10">
                    <Label
                        :class="station.status == 'Ready to deploy' ?  'bold deploy text-center' : 'plain text-center'"
                        :text="station.status == 'Ready to deploy' ? 'Deploy' : 'Deployed 01/01/19'"></Label>
                </StackLayout>

                <FlexboxLayout justifyContent="space-between" class="p-x-30 footer">
                    <StackLayout>
                        <Image width="30" src="~/images/placeholder_active.png"></Image>
                        <Label class="bold">Station</Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="30" src="~/images/placeholder.png"></Image>
                        <Label>Data</Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="30" src="~/images/placeholder.png"></Image>
                        <Label>Settings</Label>
                    </StackLayout>
                </FlexboxLayout>

            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import { GridLayout } from "tns-core-modules/ui/layouts/grid-layout";
    import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout";
    import { Label } from "tns-core-modules/ui/label/label";
    import { Image } from "tns-core-modules/ui/image";
    import StationData from "../services/station-data";
    const stationData = new StationData();

    export default {
        data() {
            return {
                station: {
                    name: "Station Details",
                    connected: "false",
                    battery: "0",
                    availableMemory: "0",

                }
            };
        },
        props: ['stationId'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;

                stationData.getStation(this.stationId)
                    .then(this.getModules)
                    .then(this.setupModules)
                    .then(this.createStationElements);
            },

            getModules(station) {
                this.station = station[0];
                return stationData.getModules(this.station.modules)
            },

            linkModulesAndSensors(results) {
                results.forEach(function(r) {
                    r.resultPromise.then(sensors => {
                        r.module.sensorObjects = sensors;
                    });
                });
            },

            getSensors(moduleObject) {
                let result = stationData.getSensors(moduleObject.sensors);
                return {resultPromise: result, module: moduleObject};
            },

            setupModules(modules) {
                this.station.moduleObjects = modules;
                return Promise.all(this.station.moduleObjects.map(this.getSensors))
                    .then(this.linkModulesAndSensors);
            },

            goBack() {
                this.page.frame.goBack();
            },

            createStationElements() {
                this.station.connected = this.station.connected != "false";
                this.station.batteryLevel+="%";
                this.station.occupiedMemory = 100 - this.station.availableMemory;
                this.station.availableMemory+="%";
                this.page.addCss("#station-memory-bar {width: "+this.station.occupiedMemory+"%;}");

                let layout = this.page.getViewById("station-detail");

                this.station.moduleObjects.forEach(function(mod) {
                    let grid = new GridLayout();
                    grid.rows = "auto";
                    grid.columns = "*";
                    grid.className = "module-container m-10 p-10";

                    let icon = new Image();
                    icon.src = "~/images/placeholder.png";
                    icon.width = "40";
                    icon.horizontalAlignment = "left";
                    grid.addChild(icon);

                    let stack = new StackLayout();
                    stack.orientation = "vertical";
                    stack.className = "module-labels";
                    let modLabel = new Label();
                    modLabel.text = mod.name;
                    modLabel.className = "module-name";
                    stack.addChild(modLabel);
                    let sensorLabel = new Label();
                    sensorLabel.text = mod.sensorObjects[0].name;
                    sensorLabel.className = "sensor-name";
                    stack.addChild(sensorLabel);
                    grid.addChild(stack);

                    // will make these rotate, if multiple
                    // and add trend and units
                    let sensorReading = new Label();
                    sensorReading.text = mod.sensorObjects[0].currentReading.toFixed(1);
                    sensorReading.className = "sensor-reading";
                    sensorReading.horizontalAlignment = "right";
                    sensorReading.verticalAlignment = "center";
                    grid.addChild(sensorReading);

                    layout.addChild(grid);
                });
            },
        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    .col {
        width: 50%;
        border-width: 1;
        border-color: $fk-gray-lighter;
        background: $fk-gray-white;
        padding-top: 10;
        padding-bottom: 10;
    }

    .left-col {
        margin-left: 10;
        border-top-left-radius: 4;
        border-bottom-left-radius: 4;
    }

    .right-col {
        margin-right: 10;
        border-top-right-radius: 4;
        border-bottom-right-radius: 4;
    }

    .blue {
        color: $fk-primary-blue;
    }

    .red {
        color: $fk-tertiary-red;
    }

    .memory-bar-container {
        margin-top: 20;
        margin-bottom: 20;
        margin-left: 10;
        margin-right: 10;
    }

    .memory-bar {
        height: 8;
        background: $fk-gray-light;
        border-radius: 4;
    }

    #station-memory-bar {
        background: $fk-tertiary-green;
    }

    .footer {
        border-top-color: $fk-gray-lightest;
        border-top-width: 2;
        margin-top: 10;
        margin-bottom: 30;
        padding-top: 10;
    }

</style>