<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <ScreenHeader :title="_L('stationSettings')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0">
                            <!-- menu -->
                            <StackLayout class="m-t-5">
                                <Label
                                    v-for="(option, i) in menuOptions"
                                    :key="option"
                                    :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                                    :text="option"
                                    textWrap="true"
                                    @tap="selectFromMenu"
                                ></Label>
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
import routes from "../../routes";
import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";

import General from "./StationSettingsGeneral";
import Networks from "./StationSettingsNetworks";
import Firmware from "./StationSettingsFirmware";
import Modules from "./StationSettingsModuleList";
import EndDeploy from "./StationSettingsEndDeploy";

export default {
    data() {
        return {
            loggedIn: this.$portalInterface.isLoggedIn(),
            menuOptions: [_L("general"), _L("networks"), _L("firmware"), _L("modulesTitle"), _L("endDeployment")],
        };
    },
    props: ["station"],
    components: {
        ScreenHeader,
        ScreenFooter,
        General,
        Firmware,
        Networks,
    },
    methods: {
        onPageLoaded(args) {},

        selectFromMenu(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            switch (event.object.text) {
                case _L("general"):
                    this.goToGeneral();
                    break;
                case _L("networks"):
                    this.goToNetworks();
                    break;
                case _L("firmware"):
                    this.goToFirmware();
                    break;
                case _L("modulesTitle"):
                    this.goToModules();
                    break;
                case _L("endDeployment"):
                    this.goToEndDeploy();
                    break;
            }
        },

        goToGeneral() {
            this.$navigateTo(General, {
                props: {
                    station: this.station,
                },
            });
        },

        goToNetworks() {
            this.$navigateTo(Networks, {
                props: {
                    station: this.station,
                },
            });
        },

        goToFirmware() {
            this.$navigateTo(Firmware, {
                props: {
                    station: this.station,
                },
            });
        },

        goToModules() {
            this.$navigateTo(Modules, {
                props: {
                    station: this.station,
                },
            });
        },

        goToEndDeploy() {
            this.$navigateTo(EndDeploy, {
                props: {
                    station: this.station,
                },
            });
        },

        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: this.station.id,
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
.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.full-width {
    width: 100%;
    margin-bottom: 10;
}
</style>
