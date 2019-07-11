<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @navigatingFrom="onNavigatingFrom">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="*">
                    <StackLayout row="0" class="round m-y-10" @tap="goBack" horizontalAlignment="left">
                        <Image
                            width="21"
                            class="m-t-10"
                            v-show="!isEditingName"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
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
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            horizontalAlignment="left"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            horizontalAlignment="left"
                            :text="_L('nameNotPrintable')"
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

                <GridLayout rows="auto" columns="*" :class="isEditingName ? 'faded' : ''">
                    <StackLayout
                        row="0"
                        class="col left-col"
                        horizontalAlignment="left">
                        <Label class="text-center m-y-5 size-14" :text="_L('connected')"></Label>
                        <Image width="25" v-show="station.connected" src="~/images/Icon_Connected.png"></Image>
                        <Label class="text-center red" v-show="!station.connected">✘</Label>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="col right-col"
                        horizontalAlignment="right">
                        <Label class="text-center m-y-5 size-14" :text="_L('battery')"></Label>
                        <FlexboxLayout justifyContent="center">
                            <Label class="m-r-5 size-12" :text="station.batteryLevel"></Label>
                            <Image width="25" src="~/images/Icon_Battery.png"></Image>
                        </FlexboxLayout>
                    </StackLayout>
                </GridLayout>

                <GridLayout :class="'memory-bar-container ' + (isEditingName ? 'faded' : '')" rows="auto, auto" columns="*">
                    <StackLayout row="0" class="memory-bar"></StackLayout>
                    <StackLayout row="0" class="memory-bar" horizontalAlignment="left" id="station-memory-bar"></StackLayout>
                    <Label row="1" class="m-t-5 size-12" horizontalAlignment="left" :text="_L('availableMemory')"></Label>
                    <Label row="1" class="m-t-5 size-12" horizontalAlignment="right" :text="station.availableMemory"></Label>
                </GridLayout>

                <StackLayout id="station-detail" :class="isEditingName ? 'faded' : ''">
                    <GridLayout :id="'m_id-' + m.module_id" rows="auto" columns="*" v-for="m in modules" :key="m.module_id" class="module-container m-10 p-10" @tap="goToModule">
                        <Image width="40" horizontalAlignment="left" :src="(m.name.indexOf('Water') > -1 ? '~/images/Icon_Water_Module.png' :
                                                m.name.indexOf('Weather') > -1 ? '~/images/Icon_Weather_Module.png' :
                                                '~/images/Icon_Generic_Module.png')"></Image>
                        <StackLayout orientation="vertical" class="module-labels">
                            <Label :text="m.name" class="module-name size-16" />
                            <Label :id="'sensor-label-' + m.module_id" :text="m.sensorObjects[0].name" class="sensor-name size-14" />
                        </StackLayout>

                        <template v-if="m.name.indexOf('Generic') > -1 ">
                            <Image width="30" src="~/images/Icon_Congfigure.png" horizontalAlignment="right"></Image>
                        </template>
                        <template v-else>
                            <!-- faux current reading, with trend arrow and units -->
                            <StackLayout :id="'sensors-of-' + m.module_id" horizontalAlignment="right" verticalAlignment="center" orientation="vertical" class="sensor-labels">
                                <GridLayout rows="auto" columns="auto, auto">
                                    <Image col="0" width="7" class="m-r-2" src="~/images/Icon_Decrease.png"></Image>
                                    <Label col="1" :id="'sensor-reading-' + m.module_id" :text="m.sensorObjects[0].currentReading.toFixed(1)" class="size-24" />
                                </GridLayout>
                                <Label :id="'sensor-unit-' + m.module_id" :text="m.sensorObjects[0].unit" class="size-10 text-right" />
                            </StackLayout>
                        </template>
                    </GridLayout>
                </StackLayout>

                <StackLayout :class="'module-container m-10 p-10 ' + (isEditingName ? 'faded' : '')">
                    <Label
                        :class="station.status == 'Ready to deploy' ?  'bold size-24 text-center' : 'plain text-center'"
                        :text="station.status == 'Ready to deploy' ? _L('deploy') : _L('deployed')+' 01/01/19'"></Label>
                </StackLayout>

                <!-- footer -->
                <FlexboxLayout justifyContent="space-between" :class="'size-12 p-30 footer ' + (isEditingName ? 'faded' : '')">
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout @tap="goToData">
                        <Image width="20" src="~/images/Icon_Data_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('data')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('settings')"></Label>
                    </StackLayout>
                </FlexboxLayout>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";
    const dbInterface = new DatabaseInterface();

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
                },
                modules: []
            };
        },
        props: ['stationId'],
        methods: {
            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                clearInterval(this.intervalTimer);
                this.$navigateTo(routes.stations);
            },

            goToData(event) {
                this.$navigateTo(routes.dataDownload, {
                    props: {
                        stationId: this.stationId,
                        url: this.station.url,
                        stationName: this.station.name
                    }
                });
            },

            goToModule(event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.module, {
                    props: {
                        // remove the "m_id-" prefix
                        moduleId: event.object.id.split("m_id-")[1],
                        stationId: this.stationId
                    }
                });
            },

            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                dbInterface.getStation(this.stationId)
                    .then(this.getModules)
                    .then(this.setupModules)
                    .then(this.completeSetup);
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
                let matches = this.station.name.match(/^[ \w~!@#$%^&*()-.']*$/);
                this.nameNotPrintable = !matches || matches.length == 0;
                this.nameTooLong = this.station.name.length > 40;
                return !this.nameTooLong && !this.nameNotPrintable;
            },

            saveStationName() {
                let valid = this.checkName();
                if(valid) {
                    this.isEditingName = false;
                    dbInterface.setStationName(this.station);
                    let configChange = {
                        device_id: this.station.device_id,
                        before: this.station.origName,
                        after: this.station.name,
                        affected_field: "name",
                        author: this.user.name
                    };
                    dbInterface.recordStationConfigChange(configChange);
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
                return dbInterface.getModules(this.station.device_id)
            },

            linkModulesAndSensors(results) {
                results.forEach(function(r) {
                    r.resultPromise.then(sensors => {
                        r.module.sensorObjects = sensors;
                    });
                });
            },

            getSensors(moduleObject) {
                let result = dbInterface.getSensors(moduleObject.module_id);
                return {resultPromise: result, module: moduleObject};
            },

            setupModules(modules) {
                this.station.moduleObjects = modules;
                return Promise.all(this.station.moduleObjects.map(this.getSensors))
                    .then(this.linkModulesAndSensors);
            },

            completeSetup() {
                this.modules = this.station.moduleObjects;
                this.station.origName = this.station.name;
                this.station.connected = this.station.connected != "false";
                this.station.batteryLevel+="%";
                this.station.occupiedMemory = 100 - this.station.availableMemory;
                this.station.availableMemory+="%";
                this.page.addCss("#station-memory-bar {width: "+this.station.occupiedMemory+"%;}");

                let sensorsToCycle = [];
                this.station.moduleObjects.forEach(function(mod) {
                    if(mod.sensorObjects.length > 1) {
                        sensorsToCycle.push({
                            "stackId": "sensors-of-" + mod.module_id,
                            "sensorLabelId": "sensor-label-" + mod.module_id,
                            "sensorReadingId": "sensor-reading-" + mod.module_id,
                            "sensorUnitId": "sensor-unit-" + mod.module_id,
                            "module": mod,
                            "currentIndex": 0
                        });
                    }
                });

                this.sensorsToCycle = sensorsToCycle;
                this.intervalTimer = setInterval(this.cycleSensorReadings, 5000);
            },

            cycleSensorReadings() {
                let page = this.page;
                this.sensorsToCycle.forEach(function(s) {
                    let stack = page.getViewById(s.stackId);
                    let sensorLabel = page.getViewById(s.sensorLabelId);
                    let sensorReading = page.getViewById(s.sensorReadingId);
                    let sensorUnit = page.getViewById(s.sensorUnitId);

                    s.currentIndex = s.currentIndex == s.module.sensorObjects.length-1 ? 0 : s.currentIndex+1;
                    sensorLabel.animate({
                        opacity: 0,
                        duration: 1000
                    }).then(function() {
                        sensorLabel.text = s.module.sensorObjects[s.currentIndex].name;
                        return sensorLabel.animate({
                            opacity: 1,
                            duration: 500
                        });
                    });
                    stack.animate({
                        opacity: 0,
                        duration: 1000
                    }).then(function() {
                        sensorReading.text = s.module.sensorObjects[s.currentIndex].currentReading.toFixed(1);
                        sensorUnit.text = s.module.sensorObjects[s.currentIndex].unit;
                        return stack.animate({
                            opacity: 1,
                            duration: 500
                        });
                    });
                });
            },

            onNavigatingFrom() {
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
        padding-top: 5;
    }

    .round {
        width: 40;
        border-radius: 20;
    }

    .faded {
        opacity: 0.5;
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

    .module-container {
        border-radius: 4;
        border-color: $fk-gray-lighter;
        border-width: 1;
    }

    .module-labels {margin-left: 50;}

    .sensor-name {
        font-family: 'Avenir LT Pro', 'AvenirLTPro-Book';
    }
</style>