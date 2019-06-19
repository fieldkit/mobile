<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <ScrollView>
            <StackLayout>
                <GridLayout rows="auto" columns="*">
                    <Image
                        row="0"
                        class="m-10"
                        width="21"
                        horizontalAlignment="left"
                        v-show="!isEditingName"
                        @tap="goBack"
                        src="~/images/Icon_backarrow.png"></Image>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="left"
                        v-show="isEditingName"
                        @tap="cancelRename"
                        src="~/images/Icon_Close.png"></Image>
                    <Label
                        row="0"
                        class="title m-y-20 text-center station-name"
                        :text="station.name"
                        v-show="!isEditingName"
                        textWrap="true"></Label>
                    <!-- Edit name form -->
                    <StackLayout row="0" id="station-name-field" class="input-field m-y-20 text-left">
                        <FlexboxLayout>
                            <TextField
                                class="input"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                horizontalAlignment="left"
                                v-model="station.name"
                                v-show="isEditingName"
                                returnKeyType="next"
                                @blur="checkName"></TextField>
                            <Label
                                class="size-10 char-count"
                                horizontalAlignment="right"
                                :text="station.name.length"
                                v-show="isEditingName"></Label>
                        </FlexboxLayout>
                        <StackLayout class="spacer-top" id="name-field-spacer"></StackLayout>
                        <Label
                            class="validation-error"
                            id="no-name"
                            horizontalAlignment="left"
                            text="Name is a required field."
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            horizontalAlignment="left"
                            text="Name has a 40-character maximum."
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            horizontalAlignment="left"
                            text="Name must be printable."
                            textWrap="true"
                            :visibility="nameNotPrintable ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                    <!-- end edit name form -->
                    <Image
                        row="0"
                        class="m-10"
                        width="14"
                        horizontalAlignment="right"
                        v-show="!isEditingName"
                        @tap="toggleRename"
                        src="~/images/Icon_Edit.png"></Image>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="right"
                        v-show="isEditingName"
                        @tap="saveStationName"
                        src="~/images/Icon_Save.png"></Image>
                </GridLayout>

                <GridLayout rows="auto" columns="*">
                    <StackLayout
                        row="0"
                        class="col left-col"
                        horizontalAlignment="left">
                        <Label class="text-center m-y-5 size-14" text="Connected"></Label>
                        <Image width="25" v-show="station.connected" src="~/images/Icon_Connected.png"></Image>
                        <Label class="text-center red" v-show="!station.connected">✘</Label>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="col right-col"
                        horizontalAlignment="right">
                        <Label class="text-center m-y-5 size-14" text="Battery"></Label>
                        <FlexboxLayout justifyContent="center">
                            <Label class="m-r-5 size-12" :text="station.batteryLevel"></Label>
                            <Image width="25" src="~/images/Icon_Battery.png"></Image>
                        </FlexboxLayout>
                    </StackLayout>
                </GridLayout>

                <GridLayout class="memory-bar-container" rows="auto, auto" columns="*">
                    <StackLayout row="0" class="memory-bar"></StackLayout>
                    <StackLayout row="0" class="memory-bar" horizontalAlignment="left" id="station-memory-bar"></StackLayout>
                    <Label row="1" class="m-t-5 size-12" horizontalAlignment="left" text="Available Memory"></Label>
                    <Label row="1" class="m-t-5 size-12" horizontalAlignment="right" :text="station.availableMemory"></Label>
                </GridLayout>

                <StackLayout id="station-detail"></StackLayout>

                <StackLayout class="module-container m-10 p-10">
                    <Label
                        :class="station.status == 'Ready to deploy' ?  'bold size-24 text-center' : 'plain text-center'"
                        :text="station.status == 'Ready to deploy' ? 'Deploy' : 'Deployed 01/01/19'"></Label>
                </StackLayout>

                <FlexboxLayout justifyContent="space-between" class="size-12 p-x-30 footer">
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold">Station</Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Data_Inactive.png"></Image>
                        <Label class="light">Data</Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light">Settings</Label>
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
    import StationsView from "./StationsView";
    import StationData from "../services/station-data";
    const stationData = new StationData();

    export default {
        data() {
            return {
                isEditingName: false,
                noName: false,
                nameTooLong: false,
                nameNotPrintable: false,
                station: {
                    name: "FieldKit Station",
                    connected: "false",
                    battery: "0",
                    availableMemory: "0",
                    origName: "FieldKit Station"
                }
            };
        },
        props: ['stationId'],
        methods: {
            goBack() {
                clearInterval(this.intervalTimer);
                this.$navigateTo(StationsView);
            },

            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                stationData.getStation(this.stationId)
                    .then(this.getModules)
                    .then(this.setupModules)
                    .then(this.createStationElements);
            },

            toggleRename() {
                this.isEditingName = true;
            },

            checkName() {
                // reset these first
                this.noName = false;
                this.nameNotPrintable = false;
                this.nameTooLong = false;
                // then check
                this.noName = !this.station.name || this.station.name.length == 0;
                if(this.noName) {return false}
                let matches = this.station.name.match(/^[ \w~!@#$%^&*()-.]*$/);
                this.nameNotPrintable = !matches || matches.length == 0;
                this.nameTooLong = this.station.name.length > 40;
                return !this.nameTooLong && !this.nameNotPrintable;
            },

            saveStationName() {
                let valid = this.checkName();
                if(valid) {
                    this.isEditingName = false;
                    stationData.setStationName(this.station);
                    let configChange = {
                        station_id: this.station.id,
                        before: this.station.origName,
                        after: this.station.name,
                        affected_field: "name",
                        author: this.user.name
                    };
                    stationData.recordConfigChange(configChange);
                    this.station.origName = this.station.name;
                }
            },

            cancelRename() {
                this.isEditingName = false;
                this.noName = false;
                this.nameNotPrintable = false;
                this.nameTooLong = false;
                this.station.name = this.station.origName;
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

            createStationElements() {
                this.station.origName = this.station.name;
                this.station.connected = this.station.connected != "false";
                this.station.batteryLevel+="%";
                this.station.occupiedMemory = 100 - this.station.availableMemory;
                this.station.availableMemory+="%";
                this.page.addCss("#station-memory-bar {width: "+this.station.occupiedMemory+"%;}");

                let layout = this.page.getViewById("station-detail");

                let sensorsToCycle = [];
                this.station.moduleObjects.forEach(function(mod) {
                    let grid = new GridLayout();
                    grid.rows = "auto";
                    grid.columns = "*";
                    grid.className = "module-container m-10 p-10";

                    let icon = new Image();
                    icon.src = mod.name.indexOf("Water") > -1 ? "~/images/Icon_Water_Module.png" :
                        mod.name.indexOf("Weather") > -1 ? "~/images/Icon_Weather_Module.png" :
                        "~/images/Icon_Generic_Module.png";
                    icon.width = "40";
                    icon.horizontalAlignment = "left";
                    grid.addChild(icon);

                    let stack = new StackLayout();
                    stack.orientation = "vertical";
                    stack.className = "module-labels";
                    let modLabel = new Label();
                    modLabel.text = mod.name;
                    modLabel.className = "module-name size-16";
                    stack.addChild(modLabel);
                    let sensorLabel = new Label();
                    sensorLabel.text = mod.sensorObjects[0].name;
                    sensorLabel.className = "sensor-name size-14";
                    stack.addChild(sensorLabel);
                    grid.addChild(stack);

                    if(mod.name.indexOf("Generic") > -1) {
                        // gear icon
                        let gearIcon = new Image();
                        gearIcon.src = "~/images/Icon_Congfigure.png";
                        gearIcon.width = "30";
                        gearIcon.horizontalAlignment = "right";
                        grid.addChild(gearIcon);

                    } else {
                        // current reading, with trend and units
                        let sensorStack = new StackLayout();
                        sensorStack.orientation = "vertical";
                        sensorStack.className = "sensor-labels";
                        sensorStack.horizontalAlignment = "right";
                        sensorStack.verticalAlignment = "center";

                        let readingGrid = new GridLayout();
                        readingGrid.rows = "auto";
                        readingGrid.columns = "auto, auto";

                        let trendIcon = new Image();
                        trendIcon.src = Math.random() > 0.5 ? "~/images/Icon_Decrease.png" : "~/images/Icon_Increase.png";
                        trendIcon.width = "7";
                        trendIcon.col = "0";
                        trendIcon.className = "m-r-2";
                        readingGrid.addChild(trendIcon);

                        let sensorReading = new Label();
                        sensorReading.text = mod.sensorObjects[0].currentReading.toFixed(1);
                        sensorReading.className = "size-24";
                        sensorReading.col = "1";
                        readingGrid.addChild(sensorReading);
                        sensorStack.addChild(readingGrid);

                        let sensorUnit = new Label();
                        sensorUnit.text = mod.sensorObjects[0].unit;
                        sensorUnit.className = "size-10 text-right";
                        sensorStack.addChild(sensorUnit);

                        if(mod.sensorObjects.length > 1) {
                            sensorsToCycle.push({
                                "sensorLabel":sensorLabel,
                                "sensorReading":sensorReading,
                                "sensorUnit":sensorUnit,
                                "sensorStack":sensorStack,
                                "module":mod,
                                "currentIndex":0
                            });
                        }
                        grid.addChild(sensorStack);
                    }
                    layout.addChild(grid);
                });

                this.sensorsToCycle = sensorsToCycle;
                this.intervalTimer = setInterval(this.cycleSensorReadings, 5000);
            },

            cycleSensorReadings() {
                this.sensorsToCycle.forEach(function(s) {
                    s.currentIndex = s.currentIndex == s.module.sensorObjects.length-1 ? 0 : s.currentIndex+1;
                    s.sensorLabel.animate({
                        opacity: 0,
                        duration: 1000
                    }).then(function() {
                        s.sensorLabel.text = s.module.sensorObjects[s.currentIndex].name;
                        return s.sensorLabel.animate({
                            opacity: 1,
                            duration: 500
                        });
                    });

                    s.sensorStack.animate({
                        opacity: 0,
                        duration: 1000
                    }).then(function() {
                        s.sensorReading.text = s.module.sensorObjects[s.currentIndex].currentReading.toFixed(1);
                        s.sensorUnit.text = s.module.sensorObjects[s.currentIndex].unit;
                        return s.sensorStack.animate({
                            opacity: 1,
                            duration: 500
                        });
                    });
                });
            },

            navigatingFrom() {
                clearInterval(this.intervalTimer);
            }
        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    #station-name-field {
        width: 225;
        font-size: 16;
        color: $fk-primary-black;
    }

    #station-name-field .input {
        width: 195;
        border-bottom-color: $fk-primary-black;
        border-bottom-width: 1;
        padding-top: 3;
        padding-bottom: 2;
        padding-left: 0;
        padding-right: 0;
        margin: 0;
    }

    #station-name-field .char-count {
        width: 25;
        margin-top: 15;
        margin-left: 5;
    }

    .station-name {
        width: 195;
    }

    .validation-error {
        width: 195;
        font-size: 12;
        color: $fk-tertiary-red;
        border-top-color: $fk-tertiary-red;
        border-top-width: 2;
    }

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
        background: $fk-gray-lightest;
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