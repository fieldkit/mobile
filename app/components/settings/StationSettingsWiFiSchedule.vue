<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('uploadSchedule')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
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

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import * as ActionTypes from "@/store/actions";
import * as animations from "@/components/animations";

import SharedComponents from "@/components/shared";
import ScheduleEditor from "../ScheduleEditor.vue";
import WiFi from "./StationSettingsWiFi.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";

export default Vue.extend({
    data() {
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
    },
    computed: {
        station(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            this.page = args.object;
        },
        goBack(this: any, ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(WiFi, {
                    props: {
                        stationId: this.stationId,
                        station: this.station,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        onScheduleChange(this: any, schedule) {
            console.log("schedule:change", schedule);
            this.form.schedule = schedule;
        },
        saveUploadInterval(this: any) {
            console.log("schedule:form", this.form);

            this.busy = true;

            return this.$store
                .dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                    deviceId: this.station.deviceId,
                    schedules: { network: this.form.schedule },
                })
                .then(() => this.goBack())
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
