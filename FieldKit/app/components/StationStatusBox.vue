<template>
    <StackLayout id="station-status-box-container" class="m-10 bordered-container" @loaded="onPageLoaded">
        <GridLayout rows="auto,auto,auto" columns="*,*" v-if="!loading">
            <!-- recording status -->
            <StackLayout row="0" col="0">
                <Label class="text-center m-y-10 size-16"
                    :text="station.status == 'recording'
                        ? _L('recordingData')
                        : _L('notRecording')"></Label>
            </StackLayout>
            <!-- battery level -->
            <StackLayout row="0" col="1">
                <FlexboxLayout class="m-10" justifyContent="flex-end">
                    <Label class="m-r-5 size-12" :text="station.battery_level + '%'"></Label>
                    <Image width="25" :src="station.battery_image"></Image>
                </FlexboxLayout>
            </StackLayout>
            <!-- recording time -->
            <StackLayout row="1" col="0" id="outer-circle">
                <StackLayout id="inner-circle">
                    <Label class="size-16 bold m-b-3 rec-time rec-time-top" :text="elapsedRecTime"></Label>
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
                        :text="station.available_memory + '%'"></Label>
                    <GridLayout row="2" col="1" rows="auto" columns="*" class="memory-bar-container" >
                        <StackLayout row="0" class="memory-bar"></StackLayout>
                        <StackLayout row="0" class="memory-bar"
                            horizontalAlignment="left"
                            id="station-memory-bar"></StackLayout>
                    </GridLayout>
                </GridLayout>
            </StackLayout>
            <!-- deploy button -->
            <StackLayout row="2" colSpan="2" class="m-10">
                <Button v-if="station.status != 'recording'"
                    class="btn btn-primary"
                    :text="_L('deploy')"
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
            loading: true,
            elapsedRecTime: "00:00:00",
            station: {
                available_memory: 0,
                battery_level: 0,
                battery_image: "~/images/Icon_Battery_0.png",
                connected: 0,
                // set status to recording so deploy button
                // isn't visibly removed when station updates
                status: "recording"
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
            this.loading = false;
            this.station = station;
            if(this.station.status == "recording") {
                this.outer = this.page.getViewById("outer-circle");
                this.inner = this.page.getViewById("inner-circle");
                this.outer.className = this.outer.className + " active";
                this.inner.className = this.inner.className + " active";
                this.intervalTimer = setInterval(this.displayElapsedTime, 1000);
            }
            this.setBatteryImage();
            this.station.occupiedMemory = 100 - this.station.available_memory;
            this.station.available_memory = parseFloat(this.station.available_memory).toFixed(2);
            this.page.addCss("#station-memory-bar {width: " + this.station.occupiedMemory + "%;}");
        },

        updateStatus(data) {
            this.station.connected = 1;
            this.station.battery_level = data.batteryLevel;
            this.setBatteryImage();
            this.station.occupiedMemory = data.consumedMemory.toFixed(2);
            this.station.available_memory = 100 - this.station.occupiedMemory;
            this.page.addCss("#station-memory-bar {width: " + this.station.occupiedMemory + "%;}");
        },

        setBatteryImage() {
            let image = "~/images/Icon_Battery";
            let battery = this.station.battery_level;
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

        displayElapsedTime() {
            if(!this.station.deploy_start_time) {
                return
            }
            let now = new Date();
            let elapsedMillis = now - this.station.deploy_start_time;

            let seconds = Math.floor((elapsedMillis / 1000) % 60);
            seconds = seconds < 10 ? "0" + seconds : seconds;
            let minutes = Math.floor((elapsedMillis / (1000 * 60)) % 60);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            // TODO: convert to days when needed - for now, just accumulate hours
            // let hours = Math.floor((elapsedMillis / (1000 * 60 * 60)) % 24);
            let hours = Math.floor(elapsedMillis / (1000 * 60 * 60));
            hours = hours < 10 ? "0" + hours : hours;
            this.elapsedRecTime = hours + ":" + minutes + ":" + seconds;

            if(parseInt(seconds) % 2 == 0) {
                    this.outer
                        .animate({
                            scale: { x: 1, y: 1 },
                            duration: 500
                        })
                        .then(() => {
                            return this.outer.animate({
                                scale: { x: 0.98, y: 0.98 },
                                duration: 750
                            });
                        });

                    this.inner
                        .animate({
                            opacity: 0.75,
                            duration: 500
                        })
                        .then(() => {
                            return this.inner.animate({
                                opacity: 1,
                                duration: 750
                            });
                        });
            }

        },

        stopProcesses() {
            clearInterval(this.intervalTimer);
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

#outer-circle, #inner-circle {
    background: $fk-gray-white;
    border-width: 2;
    border-color: $fk-gray-light;
    border-radius: 60%;
}
#outer-circle {
    width: 120;
    height: 120;
}
#inner-circle {
    width: 110;
    height: 110;
    margin-top: 3;
    background: $fk-gray-light;
}
#outer-circle.active, #inner-circle.active {
    border-color: $fk-secondary-blue;
}
#inner-circle.active {
    background: $fk-secondary-blue;
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
