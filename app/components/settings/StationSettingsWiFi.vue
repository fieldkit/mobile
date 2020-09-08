<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('wifi')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />

        <GridLayout rows="*,70">
            <ScrollView row="0">
                <StackLayout class="p-t-10">
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
            </ScrollView>

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";

import SharedComponents from "@/components/shared";
import Networks from "./StationSettingsNetworks.vue";
import WiFiNetwork from "./StationSettingsWiFiNetwork.vue";
import WiFiSchedule from "./StationSettingsWiFiSchedule.vue";

export default Vue.extend({
    data() {
        return {
            menuOptions: [_L("network"), _L("uploadSchedule")],
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        station: {
            required: true,
            type: Object,
        },
    },
    components: {
        ...SharedComponents,
        Networks,
        WiFiNetwork,
        WiFiSchedule,
    },
    methods: {
        onPageLoaded(this: any, args) {},
        selectFromMenu(this: any, event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            switch (event.object.text) {
                case _L("network"):
                    this.goToNetwork();
                    break;
                case _L("uploadSchedule"):
                    this.goToSchedule();
                    break;
            }
        },
        goToNetwork(this: any) {
            this.$navigateTo(WiFiNetwork, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                },
            });
        },
        goToSchedule(this: any) {
            this.$navigateTo(WiFiSchedule, {
                props: {
                    stationId: this.stationId,
                    station: this.station,
                },
            });
        },
        goBack(this: any, event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(Networks, {
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
</style>
