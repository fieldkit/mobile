<template>
    <Page>
        <PlatformHeader :title="_L('stationSettings')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
                    <GridLayout rows="*" columns="*">
                        <StackLayout row="0">
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
<script lang="ts">
import Vue from "vue";
import routes from "../../routes";
import Services from "@/services/singleton";
import SharedComponents from "@/components/shared";
import General from "./StationSettingsGeneral.vue";
import Networks from "./StationSettingsNetworks.vue";
import Firmware from "./StationSettingsFirmware.vue";
import Modules from "./StationSettingsModuleList.vue";
import EndDeploy from "./StationSettingsEndDeploy.vue";

export default Vue.extend({
    data(this: any) {
        return {
            loggedIn: Services.PortalInterface().isLoggedIn(),
            menuOptions: [_L("general"), _L("networks"), _L("firmware"), _L("modulesTitle"), _L("endDeployment")],
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
        General,
        Firmware,
        Networks,
    },
    computed: {
        station(this: any) {
            return this.$s.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        selectFromMenu(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            switch (event.object.text) {
                case _L("general"):
                    return this.goToGeneral();
                case _L("networks"):
                    return this.goToNetworks();
                case _L("firmware"):
                    return this.goToFirmware();
                case _L("modulesTitle"):
                    return this.goToModules();
                case _L("endDeployment"):
                    return this.goToEndDeploy();
            }

            throw new Error("unknown option");
        },
        goToGeneral() {
            return this.$navigateTo(General, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        goToNetworks() {
            return this.$navigateTo(Networks, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        goToFirmware() {
            return this.$navigateTo(Firmware, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        goToModules() {
            return this.$navigateTo(Modules, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        goToEndDeploy() {
            return this.$navigateTo(EndDeploy, {
                props: {
                    stationId: this.stationId,
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

            return this.$navigateTo(routes.stationDetail, {
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
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
