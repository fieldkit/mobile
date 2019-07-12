<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="*">
                    <StackLayout row="0" class="round m-y-10" @tap="goBack" horizontalAlignment="left">
                        <Image
                            width="21"
                            class="m-t-10"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <Label
                        row="0"
                        class="title m-y-20 text-center module-name"
                        :text="module.name"
                        textWrap="true"></Label>
                    <StackLayout row="0" class="round m-y-10" @tap="goToConfigure" horizontalAlignment="right">
                        <Image
                            width="25"
                            class="m-t-8"
                            src="~/images/Icon_Congfigure.png"></Image>
                    </StackLayout>
                </GridLayout>

                <GridLayout rows="auto" columns="*" class="location-container m-x-10">
                    <StackLayout
                        row="0"
                        class="m-y-8 m-x-5"
                        horizontalAlignment="left">
                        <Image width=100 src="~/images/placeholder_module_location.png"></Image>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="location-label m-y-8"
                        horizontalAlignment="right">
                        <Label class="size-14"
                            :text="'Locate ' + module.name + ' here on your FieldKit station.'"
                            textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <template v-if="sensors.length > 1">
                    <StackLayout id="drop-down-container" class="m-10">
                        <DropDown :items="sensorNames"
                            @opened="onOpened"
                            @closed="onClosed"
                            @selectedIndexChanged="onSelectedIndexChanged"
                            backgroundColor="#F4F5F7"
                            class="drop-down"
                            selectedIndex="0" ></DropDown>
                    </StackLayout>
                </template>

                <StackLayout v-for="g in graphedSensors" :key="g.sensor_id" class="m-b-15">
                    <GridLayout rows="auto,auto,auto,auto"
                        columns="10*,80*,10*"
                        class="chart-section-container m-x-10">
                        <Label row="0" colSpan="2" class="text-center center-title" :text="g.name"></Label>
                        <StackLayout v-if="sensors.length > 1"
                            row="0"
                            col="2"
                            class="round small-round"
                            :id="'chart-' + g.sensor_id"
                            @tap="removeChart"
                            verticalAlignment="top">
                            <Image width="17" src="~/images/Icon_Close.png"></Image>
                        </StackLayout>
                        <Label row="1" col="0" class="size-10 m-l-2" :text="g.unit"></Label>
                        <RadCartesianChart row="2" colSpan="3" class="chart-container">
                            <LinearAxis v-tkCartesianHorizontalAxis labelFormat="%.1f" :majorStep="timeStep" />
                            <LinearAxis v-tkCartesianVerticalAxis
                                labelLayoutMode="Outer"
                                lineHidden="false"
                                labelMargin="5" />
                            <ScatterSeries v-tkCartesianSeries
                                :items="g.readings"
                                seriesName="scatterplot"
                                xProperty="time"
                                yProperty="reading" />
                            <Palette v-tkCartesianPalette seriesName="scatterplot" >
                                <PaletteEntry v-tkCartesianPaletteEntry
                                    fillColor="#1B80C9"
                                    strokeColor="#FFFFFF"
                                    strokeWidth="2" />
                            </Palette>
                        </RadCartesianChart>
                        <Label row="3"
                            colSpan="3"
                            class="text-center size-10 m-b-5"
                            :text="g.intervalUnit"></Label>
                    </GridLayout>
                </StackLayout>

                <!-- footer -->
                <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout>
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
                timeStep: 5,
                module: {
                    name: "",
                },
                sensors: [
                    {
                        name: "",
                        readings: [],
                        intervalUnit: ""
                    }
                ],
                sensorNames: ["Select..."],
                graphedSensors: []
            };
        },
        props: ['moduleId', 'stationId'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;
                this.getModule()
                    .then(this.getSensors);
            },

            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            goToConfigure(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                setTimeout(() => {
                    event.object.className = cn;
                }, 500);

                this.$navigateTo(routes.configureModule, {
                    props: {
                        moduleId: this.moduleId
                    }
                });
            },

            getModule() {
                return dbInterface.getModule(this.moduleId)
            },

            getSensors(module) {
                this.module = module[0];
                this.module.origGraphs = this.module.graphs;
                dbInterface.getSensors(this.moduleId)
                    .then(this.completeSetup);
            },

            completeSetup(sensors) {
                let graphs = this.module.graphs ? this.module.graphs.split(",") : [];
                // number of faux readings
                let numReadings = Math.round( Math.random()*20 + 10 );
                let names = ["Select..."];
                sensors.forEach((s,i) => {
                    names.push(s.name);
                    s.unit = s.unit != "" ? "(" + s.unit + ")" : s.unit;
                    s.intervalUnit = this.calculateTimeUnit();
                    // generate faux readings
                    s.readings = [];
                    let low = s.currentReading/2;
                    for(var i = 0; i < numReadings; i++) {
                        let reading = Math.random()*low + low;
                        s.readings.push({"time": i, "reading": reading});
                    }
                });
                // separate iteration to preserve order - worth it?
                let toDisplay = [];
                graphs.forEach((g) => {
                    let sensor = sensors.find((s) => {
                        return s.sensor_id == g;
                    });
                    if(sensor) {toDisplay.push(sensor);}
                });
                this.sensors = sensors;
                this.sensorNames = names;
                this.graphedSensors = toDisplay.length == 0 ? [this.sensors[0]] : toDisplay;
            },

            calculateTimeUnit() {
                let unit = "";
                if(this.module.interval < 60) {
                    unit = "Seconds";
                } else if(this.module.interval < 3600) {
                    unit = "Minutes";
                } else if(this.module.interval < 86400) {
                    unit = "Hours";
                } else if(this.module.interval < 604800) {
                    unit = "Days";
                } else {
                    unit = "Weeks";
                }
                return unit;
            },

            onOpened(event) {
                this.changeEvents = 0;
                // provide feedback by temporarily changing background color
                event.object.backgroundColor = "#CCCDCF";
                setTimeout(() => {
                    event.object.backgroundColor = "#F4F5F7";
                }, 500);
            },

            onClosed(event) {
                this.changeEvents += 1;
                this.finalizeChange();
            },

            onSelectedIndexChanged(event) {
                // console.log(event.oldIndex, event.newIndex)
                this.selectedSensor = this.sensorNames[event.newIndex];
                this.changeEvents += 1;
                this.finalizeChange();
            },

            // iOS gets change first, and android gets close first
            // so wait for both before adding new selection
            finalizeChange() {
                if(!this.selectedSensor || this.selectedSensor == "Select...") {return}
                if(this.changeEvents > 1) {
                    this.changeEvents = 0;

                    let sensor = this.sensors.find((s) => {
                        return s.name == this.selectedSensor;
                    });
                    // add to graphedSensors, if not already present
                    let index = this.graphedSensors.findIndex((s) => {
                        return s.sensor_id == sensor.sensor_id;
                    });
                    if(index == -1) {
                        this.graphedSensors.push(sensor);
                        this.saveGraphs();
                    }
                }
            },

            removeChart(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                let id = event.object.id.split("chart-")[1];
                let index = this.graphedSensors.findIndex((s) => {
                    return s.sensor_id == id;
                });
                // remove from graphedSensors
                if(index > -1) {
                    this.graphedSensors.splice(index, 1);
                    this.saveGraphs();
                }
            },

            saveGraphs() {
                let graphs = "";
                this.graphedSensors.forEach((g) => {
                    graphs += (graphs == "" ? g.sensor_id : ","+g.sensor_id);
                });
                this.module.graphs = graphs;

                dbInterface.setModuleGraphs(this.module);
                let configChange = {
                    module_id: this.module.module_id,
                    before: this.module.origGraphs,
                    after: this.module.graphs,
                    affected_field: "graphs",
                    author: this.user.name
                };
                dbInterface.recordModuleConfigChange(configChange);
                this.module.origGraphs = this.module.graphs;
            }

        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    .module-name {
        width: 195;
    }

    .round {
        width: 40;
        border-radius: 20;
    }

    .small-round {
        padding-top: 7;
        padding-bottom: 7;
    }

    .location-container {
        border-radius: 4;
        border-color: $fk-gray-lighter;
        border-width: 1;
    }

    .location-label {
        width: 225;
    }

    .chart-section-container {
        border-radius: 4;
        border-color: $fk-gray-lighter;
        border-width: 1;
    }

    .center-title {
        margin-left: 40;
    }

    .chart-container {
        height: 200;
    }

</style>