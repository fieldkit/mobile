<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('endDeployment')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0">
                            <!-- stop deployment button -->
                            <StackLayout class="m-x-20 m-t-20" v-if="station.status == 'recording'">
                                <Label :text="_L('mustBeConnectedToStop')" class="size-18 m-y-5" lineHeight="4" textWrap="true" />
                                <StackLayout class="m-t-10" />
                                <Button
                                    class="btn btn-primary btn-padded full-width"
                                    :text="_L('stopRecording')"
                                    :isEnabled="station.connected"
                                    @tap="stopRecording"
                                ></Button>
                            </StackLayout>
                            <StackLayout v-else class="m-20">
                                <Label :text="station.name + ' ' + _L('notCurrentlyRecording')" textWrap="true" />
                            </StackLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import * as dialogs from "tns-core-modules/ui/dialogs";
import routes from "../../routes";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

export default {
    data() {
        return {};
    },
    props: ["station"],
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    methods: {
        onPageLoaded(args) {},

        goBack(event) {
            if (event) {
                // Change background color when pressed
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(routes.stationSettings, {
                props: {
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        stopRecording(event) {
            // confirm stop recording
            dialogs
                .confirm({
                    title: _L("areYouSureStopRecording"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("cancel"),
                })
                .then(result => {
                    if (result) {
                        let savingStation = this.station;
                        savingStation.status = "";
                        dbInterface.setStationDeployStatus(savingStation);
                        queryStation.stopDataRecording(this.station.url).then(() => {
                            return Services.StationMonitor().recordingStatusChange(this.station.url, "stopped");
                        });
                    }
                });
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables

// Custom styles

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
