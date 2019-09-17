<template>
    <StackLayout id="station-status-box-container" class="m-10 bordered-container" @loaded="onPageLoaded">
        <GridLayout rows="auto,auto,auto" columns="*,*">
            <!-- recording status -->
            <StackLayout row="0" col="0">
                <Label class="text-center m-y-10 size-16" :text="_L('notRecording')"></Label>
            </StackLayout>
            <!-- battery level -->
            <StackLayout row="0" col="1">
                <FlexboxLayout class="m-10" justifyContent="flex-end">
                    <Label class="m-r-5 size-12" :text="station.battery_level"></Label>
                    <Image width="25" :src="station.battery_image"></Image>
                </FlexboxLayout>
            </StackLayout>
            <!-- recording time -->
            <StackLayout row="1" col="0" class="outer-circle">
                <StackLayout class="inner-circle">
                    <Label class="size-16 bold m-b-3 rec-time rec-time-top" text="00:00:00"></Label>
                    <Label class="size-12 rec-time" text="hrs min sec"></Label>
                </StackLayout>
            </StackLayout>
            <!-- connected status and available memory -->
            <StackLayout row="1" col="1">
                <GridLayout rows="auto" columns="15*,85*" class="m-t-20">
                    <Image col="0"
                        width="25"
                        v-if="station.connected == 1"
                        src="~/images/connected.png"></Image>
                    <Label col="0" class="m-t-10 text-center red" v-if="station.connected == 0">✘</Label>
                    <Label col="1" class="m-10 size-14" :text="_L('connected')"></Label>
                </GridLayout>
                <GridLayout rows="auto, auto, auto" columns="15*,85*" class="m-t-5">
                    <Image col="0" rowSpan="3" src="~/images/memory.png"></Image>

                    <Label row="0" col="1"
                        class="m-t-15 m-l-10 size-14"
                        horizontalAlignment="left"
                        :text="_L('availableMemory')"></Label>
                    <Label row="1" col="1"
                        class="m-l-10 m-t-5 m-b-10 size-12"
                        horizontalAlignment="left"
                        :text="station.available_memory"></Label>
                    <GridLayout row="2" col="1" rows="auto" columns="*" class="memory-bar-container" >
                        <StackLayout row="0" class="memory-bar"></StackLayout>
                        <StackLayout row="0" class="memory-bar"
                            horizontalAlignment="left"
                            id="station-memory-bar"></StackLayout>
                    </GridLayout>
                </GridLayout>
            </StackLayout>
            <!-- deploy button -->
            <StackLayout row="2" colSpan="2"class="m-10">
                <Button class="btn btn-primary"
                    :text="station.status == 'recording'
                        ? _L('recording')
                        : _L('deploy')"
                    automationText="deployButton"
                    @tap="emitDeployTap"></Button>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
export default {
    name: "StationStatusBox",
    data: () => {
        return {
            station: {
                available_memory: 0,
                battery_level: "0%",
                battery_image: "~/images/Icon_Battery_0.png",
                connected: 0,
                status: ""
            }
        };
    },
    props: [],
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
        },

        emitDeployTap() {
            this.$emit("deployTapped");
        },

        updateStation(station) {
            this.station = station;
            this.setBatteryImage();
            this.station.battery_level += "%";
            this.station.occupiedMemory = 100 - this.station.available_memory;
            this.station.available_memory = this.station.available_memory.toFixed(2) + "%";
            this.page.addCss("#station-memory-bar {width: " + this.station.occupiedMemory + "%;}");
        },

        updateStatus(data) {
            this.station.connected = 1;
            this.station.battery_level = data.batteryLevel + "%";
            this.setBatteryImage();
            this.station.occupiedMemory = data.consumedMemory.toFixed(2);
            this.station.available_memory = 100 - this.station.occupiedMemory + "%";
            this.page.addCss("#station-memory-bar {width: " + this.station.occupiedMemory + "%;}");
        },

        setBatteryImage() {
            let image = "~/images/Icon_Battery";
            let battery = this.station.battery_level;
            // check to see if it already has a percent sign
            if (battery.toString().indexOf("%") > -1) {
                battery = parseInt(
                    battery.toString().split("%")[0]
                );
            }
            if(battery == 0) {
                image += "_0.png";
            } else if(battery <= 20) {
                image += "_20.png";
            } else if(battery <= 40) {
                image += "_40.png";
            } else if(battery <= 60) {
                image += "_60.png";
            } else if(battery <= 80) {
                image += "_80.png";
            } else {
                image += "_100.png";
            }
            this.station.battery_image = image;
        },

    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.outer-circle, .inner-circle {
    width: 120;
    height: 120;
    background: $fk-gray-white;
    border-width: 2;
    border-color: $fk-gray-light;
    border-radius: 60%;
}
.inner-circle {
    width: 110;
    height: 110;
    margin-top: 3;
    background: $fk-gray-light;
}

.rec-time {
    color: #FFFFFF;
    text-align: center;
}
.rec-time-top {
    margin-top: 35;
    margin-bottom: 5;
}

.red {
    color: $fk-tertiary-red;
}

.memory-bar-container {
    margin-right: 10;
    margin-left: 10;
}
#station-memory-bar {
    background: $fk-tertiary-green;
}
.memory-bar {
    height: 8;
    background: $fk-gray-lightest;
    border-radius: 4;
}

.btn-primary {
    width: 100%;
}

</style>
