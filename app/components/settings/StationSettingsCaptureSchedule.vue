<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <StackLayout>
                        <ScreenHeader
                            :title="_L('dataCaptureSchedule')"
                            :subtitle="station.name"
                            :onBack="goBack"
                            :canNavigateSettings="false"
                        />
                        <StackLayout class="p-b-10"></StackLayout>
                    </StackLayout>

                    <ConnectionNote :station="station" :stationId="stationId" />

                    <ScheduleEditor v-if="form.schedule" :schedule="form.schedule" @change="onScheduleChange" />

                    <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="station.connected" @tap="onSaveSchedule" />
                </FlexboxLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import * as ActionTypes from "@/store/actions";

import ScheduleEditor from "../ScheduleEditor.vue";
import ScreenHeader from "../ScreenHeader.vue";
import ScreenFooter from "../ScreenFooter.vue";
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
        ScheduleEditor,
        ScreenHeader,
        ScreenFooter,
        ConnectionNote,
    },
    computed: {
        station(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        getStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
        onPageLoaded(this: any, args) {
            this.form.schedule = { interval: this.getStation().interval };
        },
        onScheduleChange(schedule) {
            this.form.schedule = schedule;
        },
        onSaveSchedule(this: any) {
            return Promise.all([
                this.$store.dispatch(ActionTypes.CONFIGURE_STATION_SCHEDULES, {
                    deviceId: this.getStation().deviceId,
                    schedule: this.form.schedule,
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
                    station: this.station,
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
</style>
