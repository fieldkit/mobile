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
                <Label class="text-center size-16" :text="station.deployed ? _L('recordingData') : _L('notRecording')"></Label>
            </StackLayout>
            <!-- battery level -->
            <StackLayout v-if="station.connected" row="0" col="1" class="m-t-10">
                <FlexboxLayout class="m-r-10" justifyContent="flex-end">
                    <Label class="m-r-5 size-12 lighter" :text="batteryLevel"></Label>
                    <Image width="25" :src="batteryImage"></Image>
                </FlexboxLayout>
            </StackLayout>
            <!-- recording time -->
            <GridLayout row="1" col="0" rows="auto" columns="*" class="m-t-10">
                <StackLayout row="0" id="outer-circle" />
                <StackLayout row="0" id="inner-circle">
                    <Label class="size-16 bold m-b-3 rec-time rec-time-top" :text="recording.time"></Label>
                    <Label class="size-12 rec-time" :text="recording.label"></Label>
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
                    <Image rowSpan="2" col="0" height="20" width="20" :src="dataSyncingIcon" v-if="syncing"></Image>
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
                        :text="lastSeen"
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
                    v-if="!station.deployed"
                    :isEnabled="station.connected"
                    class="btn btn-primary"
                    :text="_L('deploy')"
                    automationText="deployButton"
                    @tap="emitDeployTap"
                ></Button>
                <!-- placeholder if no deploy button -->
                <StackLayout height="20" v-if="station.deployed" />
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
            syncing: false,
            dataSyncingIcon: "~/images/Icon_Syncing_blue.png",
            dataSyncMessage: "",
        };
    },
    computed: {
        displayConsumedMemory() {
            return convertBytesToLabel(this.station.consumedMemory);
        },
        displayTotalMemory() {
            return convertBytesToLabel(this.station.totalMemory);
        },
        recording() {
            if (this.station.deployStartTime) {
                const now = new Date();
                const elapsed = (now.getTime() - this.station.deployStartTime.getTime()) / 1000;
                const seconds = Math.floor(elapsed % 60);
                const minutes = Math.floor((elapsed / 60) % 60);
                const hours = Math.floor((elapsed / (60 * 60)) % 24);
                const days = Math.floor(elapsed / (60 * 60 * 24));

                if (seconds % 2 == 0 && this.outer) {
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

                const secondsStr = seconds < 10 ? "0" + seconds : seconds;
                const minutesStr = minutes < 10 ? "0" + minutes : minutes;
                const hoursStr = hours < 10 ? "0" + hours : hours;

                if (days > 1) {
                    return {
                        time: days + ":" + hoursStr + ":" + minutesStr,
                        label: _L("daysHrsMin"),
                    };
                } else {
                    return {
                        time: hoursStr + ":" + minutesStr + ":" + secondsStr,
                        label: _L("hrsMinSec"),
                    };
                }
            } else {
                return {
                    time: "00:00:00",
                    label: "",
                };
            }
        },
        batteryImage() {
            const battery = this.station.batteryLevel;
            if (battery == 0) {
                return "~/images/Icon_Battery_0.png";
            } else if (battery <= 20) {
                return "~/images/Icon_Battery_20.png";
            } else if (battery <= 40) {
                return "~/images/Icon_Battery_40.png";
            } else if (battery <= 60) {
                return "~/images/Icon_Battery_60.png";
            } else if (battery <= 80) {
                return "~/images/Icon_Battery_80.png";
            } else {
                return "~/images/Icon_Battery_100.png";
            }
        },
        batteryLevel() {
            if (this.station.batteryLevel != 0 && !this.station.batteryLevel) {
                return "Unknown";
            }
            return this.station.batteryLevel + "%";
        },
        lastSeen() {
            if (!this.station.updated) {
                return "";
            }
            return "Since " + getLastSeen(this.station.updated);
        },
    },
    props: {
        station: {
            required: true,
        },
    },
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

            this.updateStation(this.station);
        },
        onUnloaded() {
            this.stopProcesses();
        },
        emitDeployTap() {
            this.$emit("deployTapped");
        },
        updateStation(station) {
            this.loading = false;
            if (this.station.deployStartTime) {
                this.outer = this.page.getViewById("outer-circle");
                this.inner = this.page.getViewById("inner-circle");
                this.outer.className = this.outer.className + " active";
                this.inner.className = this.inner.className + " active";
            }
            if (this.station.consumedMemoryPercent) {
                this.page.addCss("#station-memory-bar {width: " + this.station.consumedMemoryPercent + "%;}");
            }
        },
        updateStatus(data) {
            if (data.consumedMemoryPercent) {
                this.page.addCss("#station-memory-bar {width: " + data.consumedMemoryPercent + "%;}");
            }
        },
        rotateSyncingIcon() {
            this.dataSyncingIcon =
                this.dataSyncingIcon == "~/images/Icon_Syncing_blue.png"
                    ? "~/images/Icon_Syncing2_blue.png"
                    : "~/images/Icon_Syncing_blue.png";
        },
        stopProcesses() {
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
