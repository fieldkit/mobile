<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('schedules.readings.heading')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected" :scrollable="true">
            <FlexboxLayout class="capture-schedule-settings-container m-x-10 m-t-20">
                <Label :text="_L('schedules.readings.heading')" class="size-14 title" />
                <Label :text="_L('schedules.readings.warning')" class="size-12 subtitle" />

                <ScheduleEditor v-if="form.schedule" :schedule="form.schedule" @change="onScheduleChange" />

                <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="station.connected" @tap="onSaveSchedule" />
            </FlexboxLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { ConfigureStationSchedulesAction, AvailableStation, Schedule } from "@/store";
import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";
import { debug } from "@/lib/debugging";

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
            debug.log(`schedule: ${JSON.stringify(this.station.schedules.readings)}`);
            this.form.schedule = Schedule.getMinimum(this.station.schedules.readings);
        },
        onScheduleChange(schedule): void {
            debug.log(`schedule:change: ${JSON.stringify(schedule)}`);
            this.form.schedule = schedule;
        },
        async onSaveSchedule(): Promise<void> {
            if (this.form.schedule) {
                const existing = this.station.schedules;
                await Promise.all([
                    this.$s.dispatch(
                        new ConfigureStationSchedulesAction(this.station.deviceId, { readings: this.form.schedule }, existing)
                    ),
                ])
                    .then(() => this.$navigateBack())
                    .catch((error) => {
                        debug.log("error", error);
                        return error;
                    });
            }
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
