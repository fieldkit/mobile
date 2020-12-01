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
import { Schedule } from "@/store/types";

import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";
import General from "./StationSettingsGeneral.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";

export default Vue.extend({
    data() {
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
        station(this: any) {
            return this.$s.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        getStation(this: any) {
            return this.$s.getters.legacyStations[this.stationId];
        },
        onPageLoaded(this: any, args) {
            this.form.schedule = Schedule.getMinimum(this.station.schedules.readings);
        },
        onScheduleChange(schedule) {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        onSaveSchedule(this: any) {
            return Promise.all([
                this.$s.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                    deviceId: this.station.deviceId,
                    schedules: { readings: this.form.schedule },
                }),
            ])
                .then(() => this.goBack())
                .catch((error) => {
                    console.log("error", error);
                    return error;
                });
        },
        goBack(this: any, event) {
            if (event) {
                const cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            return this.$navigateTo(General, {
                props: {
                    stationId: this.stationId,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
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
