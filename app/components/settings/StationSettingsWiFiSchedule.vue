<template>
    <Page>
        <PlatformHeader :title="_L('uploadSchedule')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="auto,*,70">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="body-container">
                    <ScheduleEditor :schedule="form.schedule" @change="onScheduleChange" />

                    <Button
                        class="btn btn-primary btn-padded"
                        :text="_L('save')"
                        :isEnabled="station.connected && !busy"
                        @tap="saveUploadInterval"
                    />

                    <ConnectionNote :station="station" :stationId="stationId" />
                </StackLayout>
            </ScrollView>
            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import * as animations from "@/components/animations";
import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";
import WiFi from "./StationSettingsWiFi.vue";
import { AvailableStation } from "@/store";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    data(): {
        busy: boolean;
        form: {
            schedule: {
                intervals: {
                    start: number;
                    end: number;
                    interval: number;
                }[];
            };
        };
    } {
        return {
            busy: false,
            form: {
                schedule: {
                    intervals: [
                        {
                            start: 0,
                            end: 86400,
                            interval: 60 * 60,
                        },
                    ],
                },
            },
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ...SharedComponents,
        ConnectionNote,
        ScheduleEditor,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        async goBack(ev: Event | null): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(WiFi, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
        onScheduleChange(schedule: any): void {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        async saveUploadInterval(): Promise<void> {
            console.log("schedule:form", this.form);

            this.busy = true;

            await this.$s
                .dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                    deviceId: this.station.deviceId,
                    schedules: { network: this.form.schedule },
                })
                .then(() => this.goBack(null))
                .finally(() => {
                    this.busy = false;
                });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.body-container {
    padding: 20;
}
</style>
