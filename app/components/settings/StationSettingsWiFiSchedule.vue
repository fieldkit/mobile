<template>
    <Page>
        <PlatformHeader :title="_L('uploadSchedule')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <StackLayout class="body-container">
                <Label text="Data Upload Schedule" class="size-14 title" />
                <Label
                    text="Set a schedule for your station to bypass the app and upload data straight to the portal. Frequent data upload drains the battery faster, so this option is best for stations powered from the wall."
                    class="size-12 schedule-instructions"
                    textWrap="true"
                />

                <SettingsItemSlider :title="'stationSettings.wifiSchedule.enable'" v-model="form.enabled" :enabled="true" />

                <ScheduleEditor :schedule="form.schedule" @change="onScheduleChange" :complex="false" v-if="form.enabled" />

                <Button
                    class="btn btn-primary btn-padded"
                    :text="_L('save')"
                    :isEnabled="station.connected && !busy"
                    @tap="saveUploadInterval"
                />
            </StackLayout>
        </StationSettingsLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";
import SettingsItemSlider from "../app-settings/SettingsItemSlider.vue";
import { ActionTypes, AvailableStation } from "@/store";

export default Vue.extend({
    data(): {
        busy: boolean;
        form: {
            enabled: boolean;
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
                enabled: false,
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
        ScheduleEditor,
        SettingsItemSlider,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        onScheduleChange(schedule: any): void {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        async saveUploadInterval(): Promise<void> {
            console.log("schedule:form", this.form);

            this.busy = true;

            await this.$s.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                deviceId: this.station.deviceId,
                schedules: { network: this.form.schedule },
            });
            this.$navigateBack();
            this.busy = false;
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.body-container {
    padding: 20;
}

.schedule-instructions {
    padding-bottom: 20;
}
</style>
