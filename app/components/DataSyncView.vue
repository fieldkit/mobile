<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('dataSync')" :canNavigateBack="false" :canNavigateSettings="false" />

        <ScrollView>
            <StackLayout class="sync-panel-container" v-if="syncs.length > 0">
                <StackLayout v-for="sync in syncs" :key="sync.deviceId" class="station-container">
                    <GridLayout rows="auto" columns="*,30" @tap="onToggle(sync)">
                        <StackLayout row="0" col="0">
                            <Label :text="sync.name" textWrap="true" class="station-name"></Label>
                            <Label
                                v-if="sync.location"
                                :text="'Location: ' + sync.location"
                                textWrap="true"
                                class="station-location"
                            ></Label>
                            <Label v-if="!sync.location" text="Unknown Location" class="station-location"></Label>
                            <template v-if="!sync.connected">
                                <StackLayout class="station-connection station-disconnected m-t-5" orientation="horizontal">
                                    <Image width="30" src="~/images/Icon_Wifi_Not_Connected.png"></Image>
                                    <Label text="Not Connected" class="connected-label" />
                                    <Label :text="'Since ' + prettyDate(sync.lastSeen)" class="connected-since" />
                                </StackLayout>
                            </template>
                            <template v-else>
                                <StackLayout class="station-connection station-connected m-t-5" orientation="horizontal">
                                    <Image width="30" src="~/images/Icon_Connected_AP.png"></Image>
                                    <Label text="Station Connected" class="connected-label" />
                                </StackLayout>
                            </template>
                        </StackLayout>

                        <FlexboxLayout
                            row="0"
                            col="1"
                            class="container-icon"
                            flexDirection="column"
                            justifyContent="space-around"
                            alignItems="center"
                        >
                            <Image v-show="opened(sync)" class="icon-button" width="25" src="~/images/Icon_Cheveron_Up.png" />
                            <Image v-show="!opened(sync)" class="icon-button" width="25" src="~/images/Icon_Cheveron_Down.png" />
                        </FlexboxLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.isDownloadReady" rows="auto" columns="*,30" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                            <Label
                                v-if="sync.readingsReadyDownload > 1"
                                :text="sync.readingsReadyDownload + ' Readings'"
                                class="readings-label"
                            />
                            <Label
                                v-if="sync.readingsReadyDownload == 1"
                                :text="sync.readingsReadyDownload + ' Reading'"
                                class="readings-label"
                            />
                            <Label text="Ready to download from the station" class="transfer-label" />
                        </StackLayout>
                        <StackLayout v-if="sync.connected" row="0" col="1" class="container-icon" @tap="onDownload(sync)">
                            <Image class="icon-button" width="20" src="~/images/Icon_Download.png" />
                        </StackLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.isDownloaded" rows="auto" columns="*,30" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                            <Label
                                v-if="sync.readingsDownloaded > 1"
                                :text="sync.readingsDownloaded + ' Readings'"
                                class="readings-label"
                            />
                            <Label
                                v-if="sync.readingsDownloaded == 1"
                                :text="sync.readingsDownloaded + ' Reading'"
                                class="readings-label"
                            />
                            <Label text="Downloaded" class="transfer-label" />
                        </StackLayout>
                        <StackLayout row="0" col="1" class="container-icon">
                            <Image class="icon-button" width="20" src="~/images/Icon_Save.png" />
                        </StackLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.isCopying" rows="auto" columns="*,auto,30" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-pending transfer-busy">
                            <Label v-if="sync.readingsCopying > 1" :text="sync.readingsCopying + ' Readings'" class="readings-label" />
                            <Label v-if="sync.readingsCopying == 1" :text="sync.readingsCopying + ' Reading'" class="readings-label" />
                            <Label v-if="sync.isDownloading" text="Downloading" class="transfer-label" />
                            <Label v-if="sync.isUploading" text="Uploading" class="transfer-label" />
                        </StackLayout>
                        <StackLayout row="0" col="1" class="container-icon" orientation="horizontal">
                            <Label v-if="sync.progress" :text="sync.progress.percentage" class="transfer-progress" />
                        </StackLayout>
                        <StackLayout row="0" col="2" class="container-icon" orientation="horizontal">
                            <Image class="icon-button" width="20" src="~/images/Icon_Syncing.png" />
                        </StackLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.isUploadReady" rows="auto" columns="*,30" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-details transfer-ready">
                            <Label
                                v-if="sync.readingsReadyUpload > 1"
                                :text="sync.readingsReadyUpload + ' Readings'"
                                class="readings-label"
                            />
                            <Label
                                v-if="sync.readingsReadyUpload == 1"
                                :text="sync.readingsReadyUpload + ' Reading'"
                                class="readings-label"
                            />
                            <Label v-if="userLoggedIn" :text="_L('readyToUpload')" class="transfer-label" />
                            <StackLayout v-if="!userLoggedIn" @tap="goToLogin" class="login-needed">
                                <Label :text="_L('clickToLogin')" class="transfer-label" textWrap="true" />
                            </StackLayout>
                        </StackLayout>
                        <StackLayout row="0" col="1" class="container-icon" @tap="onUpload(sync)">
                            <Image v-if="userLoggedIn" class="icon-button" width="20" src="~/images/Icon_Upload.png" />
                            <Image v-if="!userLoggedIn" class="icon-button" width="20" src="~/images/Icon_Upload_Disabled.png" />
                        </StackLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.isComplete" rows="auto" columns="*,30" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-pending transfer-waiting">
                            <Label v-if="sync.readingsUploaded > 1" :text="sync.readingsUploaded + ' Readings'" class="readings-label" />
                            <Label v-if="sync.readingsUploaded == 1" :text="sync.readingsUploaded + ' Reading'" class="readings-label" />
                            <Label text="Synced" class="transfer-label" />
                        </StackLayout>
                        <StackLayout row="0" col="1" class="container-icon">
                            <Image class="icon-button" width="20" src="~/images/Icon_Success.png"></Image>
                        </StackLayout>
                    </GridLayout>

                    <GridLayout v-if="opened(sync) && sync.hasError" rows="auto" columns="*" class="transfer-container">
                        <StackLayout row="0" col="0" class="transfer-pending transfer-waiting">
                            <Label
                                v-if="sync.isAuthenticationError"
                                text="You are logged out. Please open settings and Log In."
                                class="error-label"
                            />
                            <Label v-if="sync.isOtherError" text="An error occurred! Oh no!" class="error-label" />
                        </StackLayout>
                    </GridLayout>
                </StackLayout>
            </StackLayout>
            <NoStationsWannaAdd v-else :image="true" />
        </ScrollView>
    </Page>
</template>

<script lang="ts">
import moment from "moment";
import Vue from "vue";
import { DownloadStationDataAction, UploadStationDataAction } from "@/store/actions";
import { StationSyncStatus } from "@/store";
import { fullRoutes, routes } from "@/routes";
import Config from "@/config";

import SharedComponents from "@/components/shared";
import NoStationsWannaAdd from "./NoStationsWannaAdd.vue";

const log = Config.logger("DataSyncView");

export default Vue.extend({
    name: "DataSync",
    components: {
        ...SharedComponents,
        NoStationsWannaAdd,
    },
    data(): { closed: { [index: string]: boolean } } {
        return {
            closed: {},
        };
    },
    computed: {
        syncs(): StationSyncStatus[] {
            return this.$s.getters.syncs;
        },
        userLoggedIn(): boolean {
            return this.$s.state.portal.accounts.length > 0;
        },
    },
    methods: {
        onPageLoaded(): void {
            console.log(
                "data-view:syncs",
                this.syncs.map((s) => s.lastSeen)
            );
        },
        onToggle(sync: StationSyncStatus): void {
            Vue.set(this.closed, sync.deviceId, this.opened(sync));
            log.info("toggle", sync.name, this.closed[sync.deviceId]);
        },
        async onDownload(sync: StationSyncStatus): Promise<void> {
            try {
                log.info("download", sync);
                await this.$s.dispatch(new DownloadStationDataAction(sync)).catch((error) => {
                    console.log(`download-error`, error);
                });
            } catch (error) {
                log.info("error", error);
            }
        },
        async onUpload(sync: StationSyncStatus): Promise<void> {
            try {
                log.info("upload", sync);
                await this.$s.dispatch(new UploadStationDataAction(sync)).catch((error) => {
                    console.log(`upload-error`, error);
                });
            } catch (error) {
                log.info("error", error);
            }
        },
        opened(sync: StationSyncStatus): boolean {
            if (this.closed[sync.deviceId] === true) {
                return false;
            }
            if (this.closed[sync.deviceId] === false) {
                return true;
            }
            return sync.connected || !sync.isComplete;
        },
        prettyDate(date: Date | string | null): string {
            if (!date) {
                return "N/A";
            }
            return moment(date).format("MM/DD/YYYY");
        },
        async goToAddStation(): Promise<void> {
            await this.$navigateTo(routes.onboarding.start, {});
        },
        async goToLogin(): Promise<void> {
            await this.$navigateTo(fullRoutes.settings.addAccount, {});
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
.connected-since {
    padding-left: 5;
    font-size: 10;
    color: $fk-gray-text;
    vertical-align: center;
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
    font-size: 12;
}
.station-connected {
}
.station-disconnected {
}
.container-icon {
    /* background-color: #ffefaa; */
}
.transfer-progress {
    vertical-align: middle;
    font-size: 14;
    color: $fk-gray-text;
    padding-right: 10;
}
.error-label {
}
.icon-button {
    /* background-color: #bfbfef; */
}
.login-needed {
    padding: 5em;
}
</style>
