<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                    <StackLayout>
                        <ScreenHeader
                            :title="_L('dataCaptureSchedule')"
                            :subtitle="station.name"
                            :onBack="goBack"
                            :canNavigateSettings="false"
                        />
                        <StackLayout class="p-b-10"></StackLayout>
                    </StackLayout>

                    <!-- data capture schedule -->
                    <ConfigureCaptureInterval :station="station" ref="configCaptureInterval" />

                    <Button class="btn btn-primary btn-padded" :text="_L('save')" :isEnabled="station.connected" @tap="goBack" />
                    <StackLayout class="p-b-20"></StackLayout>
                    <ConnectionNote :station="station" />
                </FlexboxLayout>
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";

import ConfigureCaptureInterval from "../ConfigureCaptureInterval";
import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import General from "./StationSettingsGeneral";
import ConnectionNote from "./StationSettingsConnectionNote";

export default {
    data() {
        return {};
    },
    props: ["station"],
    components: {
        ConfigureCaptureInterval,
        ScreenHeader,
        ScreenFooter,
        General,
        ConnectionNote,
    },
    methods: {
        onPageLoaded(args) {},

        goBack(event) {
            if (event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            if (this.$refs.configCaptureInterval.checkAllIntervals()) {
                this.$navigateTo(General, {
                    props: {
                        station: this.station,
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                });
            }
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables

// Custom styles
</style>
