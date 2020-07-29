<template>
    <FlexboxLayout justifyContent="space-between" class="size-12 footer" @loaded="onLoaded">
        <StackLayout @tap="goToStation" class="footer-btn" automationText="linkToStations">
            <template v-if="active == 'stations'">
                <Image width="22" height="22" src="~/images/Icon_Station_active2.png"></Image>
                <Label class="active m-t-5" :text="_L('stations')"></Label>
            </template>
            <template v-else>
                <Image width="22" height="22" src="~/images/Icon_Station_inactive2.png"></Image>
                <Label class="inactive m-t-5" :text="_L('stations')"></Label>
            </template>
        </StackLayout>
        <StackLayout @tap="goToData" class="footer-btn" automationText="linkToDataSync">
            <template v-if="active == 'data'">
                <Image width="22" height="22" src="~/images/Icon_DataSync_active2.png"></Image>
                <Label class="active m-t-5" :text="_L('data')"></Label>
            </template>
            <template v-else>
                <Image width="22" height="22" src="~/images/Icon_DataSync_inactive2.png"></Image>
                <Label class="inactive m-t-5" :text="_L('data')"></Label>
            </template>
        </StackLayout>
        <StackLayout @tap="goToSettings" class="footer-btn">
            <template v-if="active == 'settings'">
                <Image width="22" height="22" src="~/images/Icon_Settings_active2.png"></Image>
                <Label class="active m-t-5" :text="_L('settings')"></Label>
            </template>
            <template v-else>
                <Image width="22" height="22" src="~/images/Icon_Settings_inactive2.png"></Image>
                <Label class="inactive m-t-5" :text="_L('settings')"></Label>
            </template>
        </StackLayout>
    </FlexboxLayout>
</template>

<script>
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";

const log = Config.logger("ScreenFooter");

export default {
    data() {
        return {};
    },
    props: ["active"],
    methods: {
        onLoaded(args) {},

        goToStation(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.stations);
        },

        goToData(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.dataSync);
        },

        goToSettings(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.appSettings);
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "~/_app-variables";
// End custom common variables
// Custom styles
.footer {
    border-top-color: $fk-gray-lightest;
    border-top-width: 2;
    margin-bottom: 5;
    padding-left: 20;
    padding-right: 20;
    height: 100%;
}
.footer-btn {
    padding-top: 10;
    padding-left: 10;
    padding-right: 10;
    border-radius: 20;
}
.active {
    font-weight: bold;
    font-family: "Avenir LT Pro", "AvenirLTPro-Heavy";
    color: $fk-primary-black;
}
.inactive {
    font-weight: 100;
    font-family: "Avenir LT Pro", "AvenirLTPro-Book";
    color: $fk-inactive;
}
</style>
