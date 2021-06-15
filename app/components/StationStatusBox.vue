<template>
    <GridLayout row="auto">
        <StackLayout id="station-status-box-container" :class="'p-t-30 m-20 ' + (loading ? '' : 'bordered-container')" row="0">
            <GridLayout v-show="!loading" rows="auto,auto" columns="*,*" class="m-t-10">
                <!-- recording time -->
                <GridLayout row="0" col="0" rows="auto" columns="*" class="m-t-10">
                    <StackLayout id="outer-circle" :class="connectedAndDeployedClasses" row="0" />
                    <StackLayout id="inner-circle" :class="connectedAndDeployedClasses" row="0">
                        <Label class="size-20 m-b-3 rec-time rec-time-top" :text="recording.time" />
                        <Label class="size-12 rec-time" :text="recording.label" />
                    </StackLayout>
                </GridLayout>

                <!-- connected status and available memory -->
                <StackLayout row="0" col="1">
                    <GridLayout rows="auto, auto" columns="15*,85*" class="m-t-20">
                        <Image width="14" :src="batteryImage" rowSpan="2" col="0" />
                        <Label row="0" col="1" class="m-t-5 m-l-5 size-12" :text="_L('batteryLife')" />
                        <Label class="m-l-5 m-r-5 size-10 lighter" :text="batteryLevel" row="1" col="1" />
                    </GridLayout>
                    <GridLayout rows="auto, auto, auto" columns="15*,85*" class="m-t-5">
                        <Image v-if="station.connected" col="0" rowSpan="3" width="15" src="~/images/Icon_memory.png" />
                        <Image v-if="!station.connected" col="0" rowSpan="3" width="15" src="~/images/Icon_Memory_Grayed_Out.png" />
                        <Label row="0" col="1" class="m-t-15 m-l-5 size-12" horizontalAlignment="left" :text="_L('memoryUsed')" />
                        <Label
                            row="1"
                            col="1"
                            class="m-l-5 m-t-2 m-b-5 size-10 lighter"
                            horizontalAlignment="left"
                            :text="displayConsumedMemory + ' ' + _L('of') + ' ' + displayTotalMemory"
                        />
                        <GridLayout row="2" col="1" rows="auto" columns="*" class="memory-bar-container">
                            <StackLayout row="0" class="memory-bar" />
                            <StackLayout
                                id="station-memory-bar"
                                :width="displayConsumedMemoryPercent + '%'"
                                row="0"
                                class="memory-bar"
                                :class="memoryBar()"
                                horizontalAlignment="left"
                            />
                        </GridLayout>
                    </GridLayout>
                </StackLayout>

                <!-- deploy button -->
                <StackLayout row="1" colSpan="2" class="m-l-10 m-r-10 m-t-30">
                    <Button
                        v-if="!station.deployed"
                        :isEnabled="station.connected"
                        class="btn btn-primary"
                        :class="station.connected ? '' : 'button-disconnected'"
                        :text="_L('deploy')"
                        automationText="deployButton"
                        @tap="emitDeployTap"
                    />

                    <!-- placeholder if no deploy button -->
                    <StackLayout v-if="station.deployed" height="20" />
                </StackLayout>
            </GridLayout>
        </StackLayout>
        <AbsoluteLayout v-if="!station.connected" width="170" class="p-8 bordered-container" verticalAlignment="top">
            <GridLayout rows="auto,auto" columns="40,*">
                <Image v-if="stationAP" width="35" src="~/images/Icon_Wifi_Not_Connected.png" rowSpan="2" col="0" />
                <Image v-if="!stationAP" width="35" src="~/images/Icon_Wifi_Not_Connected.png" rowSpan="2" col="0" />
                <Label row="0" col="1" class="m-l-10 size-12" :text="_L('notConnected')" />
                <Label class="m-l-10 m-r-5 size-10 lighter" :text="lastSeen" row="1" col="1" />
            </GridLayout>
        </AbsoluteLayout>
        <AbsoluteLayout v-if="station.connected" width="170" class="p-8 bordered-container" verticalAlignment="top">
            <GridLayout rows="auto" columns="30,120" class="ssid-container">
                <Image v-if="stationAP" width="25" src="~/images/Icon_Connected_AP.png" rowSpan="2" col="0" />
                <Image v-if="!stationAP" width="25" src="~/images/Icon_Wifi_Connected.png" rowSpan="2" col="0" />
                <Label
                    v-if="displayedSSID"
                    row="0"
                    col="1"
                    class="size-12 ssid"
                    :text="_L('wifi') + ': ' + displayedSSID"
                    textWrap="false"
                />
                <Label v-else row="0" col="1" class="m-l-10 size-12" :text="_L('wifi') + ': ...'" />
            </GridLayout>
        </AbsoluteLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { debug, _L, Timer, getLabelledElapsedTime, getLastSeen, convertBytesToLabel } from "@/lib";
import { LegacyStation } from "@/store";

interface OtherData {
    timer: Timer;
    // eslint-disable-next-line
    page: any;
}

export default Vue.extend({
    name: "StationStatusBox",
    props: {
        station: {
            type: Object as () => LegacyStation,
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
        connectedAndDeployedClasses(): Record<string, boolean> {
            return {
                connected: this.station.connected,
                deployed: this.station.deployed,
            };
        },
        otherData(): OtherData {
            return (this as unknown) as OtherData;
        },
        displayConsumedMemory(): string {
            return convertBytesToLabel(this.station.consumedMemory || 0);
        },
        displayConsumedMemoryPercent(): number {
            if (!this.station.consumedMemory || !this.station.totalMemory) return 0;

            return (this.station.consumedMemory * 100) / this.station.totalMemory;
        },
        displayTotalMemory(): string {
            if (!this.station.totalMemory) return "";
            return convertBytesToLabel(this.station.totalMemory);
        },
        displayAvailableMemory(): string {
            if (!this.station.consumedMemory || !this.station.totalMemory) return "";
            return convertBytesToLabel(this.station.totalMemory - this.station.consumedMemory);
        },
        displayAvailableMemoryPercent(): number {
            if (!this.station.consumedMemory || !this.station.totalMemory) return 0;
            return ((this.station.totalMemory - this.station.consumedMemory) * 100) / this.station.totalMemory;
        },
        recording(): { time: string; label: string } {
            if (this.station.deployStartTime) {
                return getLabelledElapsedTime(this.now, this.station.deployStartTime);
            }
            return {
                time: "00:00:00",
                label: _L("hrsMinSec"),
            };
        },
        batteryImage(): string {
            const battery = this.station.batteryLevel;
            const statusString = this.station.connected ? "" : "_GrayedOut";
            if (battery == null || battery == 0) {
                return `~/images/Battery_0${statusString}.png`;
            } else if (battery <= 20) {
                return `~/images/Battery_20${statusString}.png`;
            } else if (battery <= 40) {
                return `~/images/Battery_40${statusString}.png`;
            } else if (battery <= 60) {
                return `~/images/Battery_60${statusString}.png`;
            } else if (battery <= 80) {
                return `~/images/Battery_80${statusString}.png`;
            } else {
                return `~/images/Icon_Battery_100${statusString}.png`;
            }
        },
        batteryLevel(): string {
            if (this.station.batteryLevel != 0 && !this.station.batteryLevel) return _L("unknown");
            return `${this.station.batteryLevel}%`;
        },
        lastSeen(): string {
            debug.log("lastSeen", this.station.lastSeen);
            if (!this.station.lastSeen) return _L("unknown");
            return `${_L("since")} ${getLastSeen(this.station.lastSeen)}`;
        },
        displayedSSID(): string | null {
            return this.$s.state.phone.network?.ssid || null;
        },
        stationAP(): boolean {
            return Boolean(this.$s.state.phone.network?.ap);
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
        memoryBar(): string {
            if (this.displayConsumedMemoryPercent < 75) {
                return "memory-bar-green";
            }
            if (this.displayConsumedMemoryPercent < 90) {
                return "memory-bar-yellow";
            }

            return "memory-bar-red";
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
    background: $fk-gray-light;
}

#outer-circle.connected,
#inner-circle.connected {
    border-color: $fk-circle-blue;
}
#inner-circle.connected {
    background: $fk-circle-blue;
}

#outer-circle.connected.deployed,
#inner-circle.connected.deployed {
    border-color: #0a67aa;
}
#inner-circle.connected.deployed {
    background: #0a67aa;
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
    margin-left: 5;
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

.button-disconnected {
    color: $white;
    background-color: $fk-gray-lighter;
}

AbsoluteLayout {
    background-color: $white;
}

.ssid-container {
}

.ssid {
    // This is important to ensuring that the ellipses appear when this is too long.
    width: 290px;
}

.memory-bar-green {
    background: $fk-tertiary-green;
}

.memory-bar-yellow {
    background: $fk-tertiary-yellow;
}

.memory-bar-red {
    background: $fk-tertiary-red;
}
</style>
