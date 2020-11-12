<template>
    <StackLayout id="station-status-box-container" :class="'m-10 ' + (loading ? '' : 'bordered-container')">
        <GridLayout v-show="!loading" rows="auto,auto,auto" columns="*,*">
            <!-- recording status -->
            <StackLayout row="0" col="0" class="m-t-10">
                <Label class="text-center size-16" :text="station.deployed ? _L('recordingData') : _L('notRecording')" />
            </StackLayout>

            <!-- battery level -->
            <StackLayout v-if="station.connected" row="0" col="1" class="m-t-10">
                <FlexboxLayout class="m-r-10" justifyContent="flex-end">
                    <Label class="m-r-5 size-12 lighter" :text="batteryLevel" />
                    <Image width="25" :src="batteryImage" />
                </FlexboxLayout>
            </StackLayout>

            <!-- recording time -->
            <GridLayout row="1" col="0" rows="auto" columns="*" class="m-t-10">
                <StackLayout id="outer-circle" row="0" />
                <StackLayout id="inner-circle" row="0">
                    <Label class="size-16 bold m-b-3 rec-time rec-time-top" :text="recording.time" />
                    <Label class="size-12 rec-time" :text="recording.label" />
                </StackLayout>
            </GridLayout>

            <!-- connected status and available memory -->
            <StackLayout row="1" col="1">
                <GridLayout rows="auto, auto" columns="15*,85*" class="m-t-20">
                    <Image v-if="station.connected && !syncing" rowSpan="2" col="0" width="20" src="~/images/Icon_Connected.png" />
                    <Image v-if="!station.connected && !syncing" rowSpan="2" col="0" width="20" src="~/images/Icon_not_Connected.png" />
                    <Image v-if="syncing" rowSpan="2" col="0" height="20" width="20" :src="dataSyncingIcon" />
                    <Label
                        v-if="!syncing"
                        row="0"
                        col="1"
                        class="m-t-10 m-l-10 size-14"
                        :text="station.connected ? _L('connected') : _L('notConnected')"
                    />
                    <Label v-if="!syncing && !station.connected" row="1" col="1" class="m-l-10 m-t-2 m-b-5 size-12" :text="lastSeen" />
                    <Label v-if="syncing" row="0" col="1" class="m-10 size-14" :text="dataSyncMessage" />
                </GridLayout>
                <GridLayout rows="auto, auto, auto" columns="15*,85*" class="m-t-5">
                    <Image col="0" rowSpan="3" width="20" src="~/images/Icon_memory.png" />
                    <Label row="0" col="1" class="m-t-15 m-l-10 size-14" horizontalAlignment="left" :text="_L('memoryUsed')" />
                    <Label
                        row="1"
                        col="1"
                        class="m-l-10 m-t-2 m-b-5 size-12"
                        horizontalAlignment="left"
                        :text="displayConsumedMemory + ' ' + _L('of') + ' ' + displayTotalMemory"
                    />
                    <GridLayout row="2" col="1" rows="auto" columns="*" class="memory-bar-container">
                        <StackLayout row="0" class="memory-bar" />
                        <StackLayout id="station-memory-bar" row="0" class="memory-bar" horizontalAlignment="left" />
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
                />

                <!-- placeholder if no deploy button -->
                <StackLayout v-if="station.deployed" height="20" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { getLabelledElapsedTime, getLastSeen, convertBytesToLabel } from "@/utilities";
// import { Enums } from "@nativescript/core";
import { Timer } from "@/common/timer";
import { Station } from "@/store";

interface OtherData {
    timer: Timer;
    // eslint-disable-next-line
    page: any;
}

export default Vue.extend({
    name: "StationStatusBox",
    props: {
        station: {
            type: Object as () => Station,
            required: true,
        },
    },
    data(): { loading: boolean; syncing: boolean; dataSyncingIcon: string; dataSyncMessage: string; now: Date } {
        return {
            loading: false,
            syncing: false,
            dataSyncingIcon: "~/images/Icon_Syncing_blue.png",
            dataSyncMessage: "",
            now: new Date(),
        };
    },
    computed: {
        otherData(): OtherData {
            return (this as unknown) as OtherData;
        },
        displayConsumedMemory(): string {
            if (!this.station.consumedMemory) return "";
            return convertBytesToLabel(this.station.consumedMemory);
        },
        displayTotalMemory(): string {
            if (!this.station.totalMemory) return "";
            return convertBytesToLabel(this.station.totalMemory);
        },
        recording(): { time: string; label: string } {
            if (this.station.deployStartTime) {
                return getLabelledElapsedTime(this.now, this.station.deployStartTime);
            }
            return {
                time: "00:00:00",
                label: "",
            };
        },
        batteryImage(): string {
            const battery = this.station.batteryLevel;
            if (battery == null || battery == 0) {
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
        batteryLevel(): string {
            if (this.station.batteryLevel != 0 && !this.station.batteryLevel) return _L("unknown");
            return `${this.station.batteryLevel}%`;
        },
        lastSeen(): string {
            console.log("lastSeen", this.station.lastSeen);
            if (!this.station.lastSeen) return _L("unknown");
            return `${_L("since")} ${getLastSeen(this.station.lastSeen)}`;
        },
    },
    mounted(): void {
        this.otherData.timer = new Timer(1000, () => {
            this.now = new Date();
        });
    },
    destroyed(): void {
        this.otherData.timer.stop();
    },
    methods: {
        emitDeployTap(): void {
            this.$emit("deploy-tapped");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
