<template>
    <FlexboxLayout
        justifyContent="space-between"
        class="size-12 p-30 footer"
        @loaded="onLoaded"
    >
        <StackLayout @tap="goToStation" class="footer-btn">
            <template v-if="active == 'station'">
                <Image
                    width="20"
                    src="~/images/Icon_Station_Active.png"
                ></Image>
                <Label class="bold m-t-2" :text="_L('station')"></Label>
            </template>
            <template v-else>
                <Image
                    width="20"
                    src="~/images/Icon_Station_Inactive.png"
                ></Image>
                <Label class="light m-t-2" :text="_L('station')"></Label>
            </template>
        </StackLayout>
        <StackLayout @tap="goToData" class="footer-btn">
            <template v-if="active == 'data'">
                <Image width="20" src="~/images/Icon_DataSync_Active.png"></Image>
                <Label class="bold m-t-2" :text="_L('data')"></Label>
            </template>
            <template v-else>
                <Image width="20" src="~/images/Icon_DataSync_Inactive.png"></Image>
                <Label class="light m-t-2" :text="_L('data')"></Label>
            </template>
        </StackLayout>
        <StackLayout @tap="goToSettings" class="footer-btn">
            <template v-if="active == 'settings'">
                <Image
                    width="20"
                    src="~/images/Icon_Settings_Active.png"
                ></Image>
                <Label class="bold m-t-2" :text="_L('settings')"></Label>
            </template>
            <template v-else>
                <Image
                    width="20"
                    src="~/images/Icon_Settings_Inactive.png"
                ></Image>
                <Label class="light m-t-2" :text="_L('settings')"></Label>
            </template>
        </StackLayout>
    </FlexboxLayout>
</template>

<script>
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";

const log = Config.logger("StationFooterTabs");

export default {
    data() {
        return {};
    },
    props: ["station", "active"],
    methods: {
        onLoaded(args) {},

        goToStation(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.stationDetail, {
                props: {
                    station: this.station
                }
            });
        },

        goToData() {
            this.$navigateTo(routes.dataDownload, {
                props: {
                    station: this.station
                }
            });
        },

        goToSettings() {}
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
</style>
