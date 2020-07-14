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

<script>
import routes from "../../routes";
import * as ActionTypes from "../../store/actions";

import ScheduleEditor from "../ScheduleEditor.vue";
import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import General from "./StationSettingsGeneral";
import ConnectionNote from "./StationSettingsConnectionNote";

export default {
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
        station() {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        getStation() {
            return this.$store.getters.legacyStations[this.stationId];
        },
        onPageLoaded(args) {
            this.form.schedule = { interval: this.getStation().interval };
        },
        onScheduleChange(schedule) {
            this.form.schedule = schedule;
        },
        onSaveSchedule() {
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
        goBack(event) {
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
};
</script>

<style scoped lang="scss">
@import "../../app-variables";
</style>
