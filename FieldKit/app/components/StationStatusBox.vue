<template>
    <StackLayout
        id="station-status-box-container"
        :class="'m-10 ' + (loading ? '' : 'bordered-container')"
        @loaded="onPageLoaded"
        @unloaded="onUnloaded"
    >
        <GridLayout rows="auto,auto,auto" columns="*,*" v-show="!loading">
            <!-- recording status -->
            <StackLayout row="0" col="0" class="m-t-10">
                <Label class="text-center size-16" :text="station.status == 'recording' ? _L('recordingData') : _L('notRecording')"></Label>
            </StackLayout>
            <!-- battery level -->
            <StackLayout v-if="station.connected" row="0" col="1" class="m-t-10">
                <FlexboxLayout class="m-r-10" justifyContent="flex-end">
                    <Label class="m-r-5 size-12 lighter" :text="station.batteryLevel + '%'"></Label>
                    <Image width="25" :src="station.batteryImage"></Image>
                </FlexboxLayout>
            </StackLayout>
            <!-- recording time -->
            <GridLayout row="1" col="0" rows="auto" columns="*" class="m-t-10">
                <StackLayout row="0" id="outer-circle" />
                <StackLayout row="0" id="inner-circle">
                    <Label class="size-16 bold m-b-3 rec-time rec-time-top" :text="elapsedRecTime"></Label>
                    <Label class="size-12 rec-time" :text="elapsedTimeLabel"></Label>
                </StackLayout>
            </GridLayout>
            <!-- connected status and available memory -->
            <StackLayout row="1" col="1">
                <GridLayout rows="auto, auto" columns="15*,85*" class="m-t-20">
                    <Image rowSpan="2" col="0" width="20" v-if="station.connected && !syncing" src="~/images/Icon_Connected.png"></Image>
                    <Image
                        rowSpan="2"
                        col="0"
                        width="20"
                        v-if="!station.connected && !syncing"
                        src="~/images/Icon_not_Connected.png"
                    ></Image>
                    <Image rowSpan="2" col="0" width="20" :src="dataSyncingIcon" v-if="syncing"></Image>
                    <Label
                        row="0"
                        col="1"
                        class="m-t-10 m-l-10 size-14"
                        :text="this.station.connected ? _L('connected') : _L('notConnected')"
                        v-if="!syncing"
                    ></Label>
                    <Label
                        row="1"
                        col="1"
                        class="m-l-10 m-t-2 m-b-5 size-12"
                        :text="lastSeen()"
                        v-if="!syncing && !station.connected"
                    ></Label>
                    <Label row="0" col="1" class="m-10 size-14" :text="dataSyncMessage" v-if="syncing"></Label>
                </GridLayout>
                <GridLayout rows="auto, auto, auto" columns="15*,85*" class="m-t-5">
                    <Image col="0" rowSpan="3" width="20" src="~/images/Icon_memory.png"></Image>
                    <Label row="0" col="1" class="m-t-15 m-l-10 size-14" horizontalAlignment="left" :text="_L('memoryUsed')"></Label>
                    <Label
                        row="1"
                        col="1"
                        class="m-l-10 m-t-2 m-b-5 size-12"
                        horizontalAlignment="left"
                        :text="displayConsumedMemory + ' ' + _L('of') + ' ' + displayTotalMemory"
                    ></Label>
                    <GridLayout row="2" col="1" rows="auto" columns="*" class="memory-bar-container">
                        <StackLayout row="0" class="memory-bar"></StackLayout>
                        <StackLayout row="0" class="memory-bar" horizontalAlignment="left" id="station-memory-bar"></StackLayout>
                    </GridLayout>
                </GridLayout>
            </StackLayout>
            <!-- deploy button -->
            <StackLayout row="2" colSpan="2" class="m-l-10 m-r-10">
                <Button
                    v-if="station.status != 'recording'"
                    :isEnabled="station.connected"
                    class="btn btn-primary"
                    :text="_L('deploy')"
                    automationText="deployButton"
                    @tap="emitDeployTap"
                ></Button>
                <!-- placeholder if no deploy button -->
                <StackLayout height="20" v-if="station.status == 'recording'" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
import Services from "../services/services";
import { getLastSeen, convertBytesToLabel } from "../utilities";
import { AnimationCurve } from "tns-core-modules/ui/enums";

export default {
    name: "StationStatusBox",
    data: () => {
        return {
            loading: true,
            elapsedRecTime: "--:--:--",
            elapsedTimeLabel: _L("hrsMinSec"),
            syncing: false,
            dataSyncingIcon: "~/images/Icon_Syncing_blue.png",
            dataSyncMessage: "",
            displayConsumedMemory: 0,
            displayTotalMemory: 0,
            station: {
                batteryLevel: 0,
                batteryImage: "~/images/Icon_Battery_0.png",
                connected: false,
                status: "",
            },
        };
    },
    props: [],
    methods: {
        onPageLoaded(args) {
            this.page = args.object;

            Services.ProgressService().subscribe(data => {
                if (data.message) {
                    this.syncing = true;
                    this.dataSyncMessage = data.message;
                    if (!this.syncIconIntervalTimer) {
                        this.syncIconIntervalTimer = setInterval(this.rotateSyncingIcon, 500);
                    }
                } else {
                    this.syncing = false;
                }
            });
        },

        onUnloaded() {
            this.stopProcesses();
        },

        emitDeployTap() {
            this.$emit("deployTapped");
        },

        updateStation(station) {
            this.loading = false;
            this.station = station;
            if (this.station.status == "recording") {
                this.outer = this.page.getViewById("outer-circle");
                this.inner = this.page.getViewById("inner-circle");
                this.outer.className = this.outer.className + " active";
                this.inner.className = this.inner.className + " active";
                this.intervalTimer = setInterval(this.displayElapsedTime, 1000);
            } else {
                this.elapsedRecTime = "00:00:00";
            }
            this.setBatteryImage();
            this.displayConsumedMemory = convertBytesToLabel(this.station.consumedMemory);
            this.displayTotalMemory = convertBytesToLabel(this.station.totalMemory);
            if (this.station.consumedMemoryPercent) {
                this.page.addCss("#station-memory-bar {width: " + this.station.consumedMemoryPercent + "%;}");
            }
        },

        updateStatus(data) {
            this.station.batteryLevel = data.batteryLevel;
            this.setBatteryImage();
            this.displayConsumedMemory = data.consumedMemory;
            this.displayTotalMemory = data.totalMemory;
            if (data.consumedMemoryPercent) {
                this.page.addCss("#station-memory-bar {width: " + data.consumedMemoryPercent + "%;}");
            }
        },

        setBatteryImage() {
            let image = "~/images/Icon_Battery";
            let battery = this.station.batteryLevel;
            if (battery == 0) {
                image += "_0.png";
            } else if (battery <= 20) {
                image += "_20.png";
            } else if (battery <= 40) {
                image += "_40.png";
            } else if (battery <= 60) {
                image += "_60.png";
            } else if (battery <= 80) {
                image += "_80.png";
            } else {
                image += "_100.png";
            }
            this.station.batteryImage = image;
        },

        lastSeen() {
            if (!this.station.updated) {
                return "";
            }
            return "Since " + getLastSeen(this.station.updated);
        },

        displayElapsedTime() {
            if (!this.station.deployStartTime) {
                this.elapsedRecTime = "00:00:00";
                return;
            }
            let now = new Date();
            let elapsedMillis = now - this.station.deployStartTime;

            let seconds = Math.floor((elapsedMillis / 1000) % 60);
            seconds = seconds < 10 ? "0" + seconds : seconds;
            let minutes = Math.floor((elapsedMillis / (1000 * 60)) % 60);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            let hours = Math.floor((elapsedMillis / (1000 * 60 * 60)) % 24);
            hours = hours < 10 ? "0" + hours : hours;
            let days = Math.floor(elapsedMillis / (1000 * 60 * 60 * 24));
            if (days > 1) {
                this.elapsedRecTime = days + ":" + hours + ":" + minutes;
                this.elapsedTimeLabel = _L("daysHrsMin");
            } else {
                this.elapsedRecTime = hours + ":" + minutes + ":" + seconds;
                this.elapsedTimeLabel = _L("hrsMinSec");
            }

            if (parseInt(seconds) % 2 == 0) {
                this.outer
                    .animate({
                        scale: { x: 1, y: 1 },
                        duration: 750,
                        curve: AnimationCurve.easeOut,
                    })
                    .then(() => {
                        return this.outer.animate({
                            scale: { x: 0.96, y: 0.96 },
                            duration: 500,
                            curve: AnimationCurve.easeIn,
                        });
                    });
            }
        },

        rotateSyncingIcon() {
            this.dataSyncingIcon =
                this.dataSyncingIcon == "~/images/Icon_Syncing_blue.png"
                    ? "~/images/Icon_Syncing2_blue.png"
                    : "~/images/Icon_Syncing_blue.png";
        },

        stopProcesses() {
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
            }
            if (this.syncIconIntervalTimer) {
                clearInterval(this.syncIconIntervalTimer);
            }
        },
    },
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

#outer-circle,
#inner-circle {
    background: $fk-gray-white;
    border-width: 2;
    border-color: $fk-primary-black;
    border-radius: 60%;
}
#outer-circle {
    width: 120;
    height: 120;
}
#inner-circle {
    width: 110;
    height: 110;
    background: $fk-primary-black;
}
// was blue
#outer-circle.active,
#inner-circle.active {
    border-color: $fk-primary-black;
}
#inner-circle.active {
    background: $fk-primary-black;
}

.rec-time {
    color: #ffffff;
    text-align: center;
}
.rec-time-top {
    margin-top: 35;
    margin-bottom: 5;
}

.memory-bar-container {
    margin-right: 40;
    margin-left: 10;
}
#station-memory-bar {
    background: $fk-tertiary-green;
}
.memory-bar {
    height: 5;
    background: $fk-gray-lightest;
    border-radius: 4;
}

.lighter {
    color: $fk-gray-hint;
}

.btn-primary {
    width: 100%;
}
</style>
