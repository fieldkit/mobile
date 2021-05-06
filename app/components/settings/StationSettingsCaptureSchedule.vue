<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('dataCaptureSchedule')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected" :scrollable="false">
            <FlexboxLayout class="capture-schedule-settings-container m-x-10 m-t-20">
                <Label :text="_L('dataCaptureSchedule')" class="size-14 title" />
                <Label text="Frequent data capture drains the battery at a quicker rate." class="size-12 subtitle" />

                <ScheduleEditor v-if="form.schedule" :schedule="form.schedule" @change="onScheduleChange" />

                <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="station.connected" @tap="onSaveSchedule" />
            </FlexboxLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "@/store/actions";
import { AvailableStation, Schedule } from "@/store";
import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";

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
                .then(() => this.$navigateBack())
                .catch((error) => {
                    console.log("error", error);
                    return error;
                });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.capture-schedule-settings-container {
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
}
</style>
