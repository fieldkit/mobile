<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onPageUnloaded">
        <GridLayout rows="*,55">
            <ScrollView row="0">
                <GridLayout rows="60,*" automationText="dataSyncLayout">
                    <ScreenHeader row="0" class="p-t-10" :title="_L('dataSync')" :canNavigateBack="false" :canNavigateSettings="false" />
                    <StackLayout row="1" class="sync-panel-container">
                        <StackLayout v-for="sync in syncs" :key="sync.deviceId" class="station-container">
                            <GridLayout rows="auto" columns="80*, 20*">
                                <StackLayout row="0" col="0">
                                    <Label :text="sync.name" textWrap="true" class="station-name"></Label>
                                    <Label v-if="sync.location" :text="sync.location" textWrap="true" class="station-location"></Label>
                                    <Label v-if="!sync.location" text="Unknown Location" class="station-location"></Label>
                                    <template v-if="!sync.connected">
                                        <StackLayout class="station-connection station-disconnected" orientation="horizontal">
                                            <Image width="20" src="~/images/Icon_not_Connected.png"></Image>
                                            <Label text="Not Connected" class="connected-label" />
                                            <Label :text="'Since ' + '12/20/2019'" class="connected-since" />
                                        </StackLayout>
                                    </template>
                                    <template v-else>
                                        <StackLayout class="station-connection station-connected" orientation="horizontal">
                                            <Image width="20" src="~/images/Icon_Connected.png"></Image>
                                            <Label text="Station Connected" class="connected-label" />
                                        </StackLayout>
                                    </template>
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Connected.png" @tap="onToggle(sync.deviceId)"></Image>
                                </StackLayout>
                            </GridLayout>
                            <GridLayout rows="auto" columns="80*, 20*" class="transfer-container" v-if="allOpened || opened[sync.deviceId]">
                                <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                                    <Label :text="sync.readingsReady() + ' Readings'" class="readings-label" />
                                    <Label text="Ready to download from station" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Connected.png"></Image>
                                </StackLayout>
                            </GridLayout>
                            <GridLayout rows="auto" columns="80*, 20*" class="transfer-container" v-if="allOpened || opened[sync.deviceId]">
                                <StackLayout row="0" col="0" class="transfer-pending transfer-busy">
                                    <Label :text="sync.readingsCopying() + ' Readings'" class="readings-label" />
                                    <Label text="Downloading" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Connected.png"></Image>
                                </StackLayout>
                            </GridLayout>
                            <GridLayout rows="auto" columns="80*, 20*" class="transfer-container" v-if="allOpened || opened[sync.deviceId]">
                                <StackLayout row="0" col="0" class="transfer-pending transfer-waiting">
                                    <Label :text="sync.readingsHave() + ' Readings'" class="readings-label" />
                                    <Label text="Downloaded" class="transfer-label" />
                                </StackLayout>
                                <StackLayout row="0" col="1" class="container-icon">
                                    <Image width="20" src="~/images/Icon_Connected.png"></Image>
                                </StackLayout>
                            </GridLayout>
                        </StackLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>
            <ScreenFooter row="1" active="data" />
        </GridLayout>
    </Page>
</template>

<script>
import _ from "lodash";
import Services from "../services/services";
import Config from "../config";
import routes from "../routes";
import ScreenFooter from "./ScreenFooter";
import ScreenHeader from "./ScreenHeader";

import { convertBytesToLabel } from "../utilities";

const dbInterface = Services.Database();

const log = Config.logger("DataSyncView");

export default {
    data() {
        return {
            allOpened: true,
            opened: {},
        };
    },
    components: {
        ScreenHeader,
        ScreenFooter,
    },
    computed: {
        syncs() {
            return this.$store.getters.syncs;
        },
    },
    methods: {
        onPageLoaded(args) {},
        onPageUnloaded(args) {},
        onToggle(deviceId) {
            this.opened[deviceId] = !this.opened[deviceId];
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";

.station-container {
    margin: 15;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
    padding: 10;
}
.transfer-container {
    margin-top: 10;
    padding-top: 15;
    padding-bottom: 10;
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
.transfer-details {
}
.station-name {
    font-size: 18;
}
.station-location {
    font-size: 16;
    color: $fk-gray-text;
}
.station-connection {
    vertical-align: middle;
}
.station-connection .connected-label {
    vertical-align: middle;
    padding-left: 10;
}
.station-connected {
}
.station-disconnected {
}
.container-icon {
    vertical-align: middle;
}
</style>
