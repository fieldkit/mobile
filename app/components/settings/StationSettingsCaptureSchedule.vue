<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('dataCaptureSchedule')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <ConnectionNote :station="station" :stationId="stationId" />

                    <StackLayout class="editor-container">
                        <ScheduleEditor v-if="form.schedule" :schedule="form.schedule" @change="onScheduleChange" />
                    </StackLayout>

                    <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="station.connected" @tap="onSaveSchedule" />
                </FlexboxLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import { AvailableStation, Schedule } from "@/store";
import SharedComponents from "@/components/shared";
import * as animations from "@/components/animations";
import ScheduleEditor from "../ScheduleEditor.vue";
import General from "./StationSettingsGeneral.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";

export default Vue.extend({
    data(): {
        form: {
            schedule: Schedule | null;
        };
    } {
        return {
            form: {
                schedule: null,
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
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        onPageLoaded(): void {
            this.form.schedule = Schedule.getMinimum(this.station.schedules.readings);
        },
        onScheduleChange(schedule): void {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        async onSaveSchedule(): Promise<void> {
            await Promise.all([
                this.$s.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                    deviceId: this.station.deviceId,
                    schedules: { readings: this.form.schedule },
                }),
            ])
                .then(() => this.goBack(null))
                .catch((error) => {
                    console.log("error", error);
                    return error;
                });
        },
        async goBack(ev: Event | null): Promise<void> {
            await Promise.all([
                animations.pressed(ev),
                this.$navigateTo(General, {
                    props: {
                        stationId: this.stationId,
                    },
                }),
            ]);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.editor-container {
    padding: 20;
}
</style>
