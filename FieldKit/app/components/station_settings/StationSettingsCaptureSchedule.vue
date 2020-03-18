<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                    <StackLayout>
                        <ScreenHeader
                            title="Data Capture Schedule"
                            :subtitle="station.name"
                            :onBack="goBack"
                            :canNavigateSettings="false"
                        />
                        <StackLayout class="p-b-10"></StackLayout>
                    </StackLayout>

                    <!-- data capture schedule -->
                    <ConfigureCaptureInterval :station="station" />

                    <Button class="btn btn-primary btn-padded" text="Save" @tap="goBack" />
                    <StackLayout class="p-b-20"></StackLayout>
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
