<template>
    <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
        <StackLayout @tap="navigateStation" class="footer-btn">
            <Image width="20" src="~/images/Icon_Station_Inactive.png"></Image>
            <Label class="light m-t-2" :text="_L('station')"></Label>
        </StackLayout>
        <StackLayout @tap="navigateData" class="footer-btn">
            <Image width="20" src="~/images/Icon_Data_Selected.png"></Image>
            <Label class="bold m-t-2" :text="_L('data')"></Label>
        </StackLayout>
        <StackLayout @tap="navigateSettings">
            <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
            <Label class="light m-t-2" :text="_L('settings')"></Label>
        </StackLayout>
    </FlexboxLayout>
</template>

<script>
import Services from '../services/services';
import Config from '../config';
import routes from "../routes";

const log = Config.logger('StationFooterTabs');

export default {
    data() {
        return {
        };
    },

    computed: {
    },

    props: {
        station: Object,
    },

    methods: {
        onLoaded(args) {
        },

        navigateStation() {
            this.$navigateTo(routes.stationDetail, {
                props: {
                    station: this.station, // TODO Remove all but this.
                    stationId: this.station.id,
                    stationName: this.station.name,
                    url: this.station.url,
                }
            });
        },

        navigateData() {
            this.$navigateTo(routes.dataDownload, {
                props: {
                    station: this.station, // TODO Remove all but this.
                    stationId: this.station.id,
                    stationName: this.station.name,
                    url: this.station.url,
                }
            });
        },

        navigateSettings() {
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
</style>
