<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader title="Developer" :canNavigateBack="false" :canNavigateSettings="false" />
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <!--
                <StackLayout class="m-x-20 m-b-20">
                    <DropDown
                        class="drop-down"
                        :items="dropDownValues"
                        :selectedIndex="selectedPortalEnvIndex"
                        @selectedIndexChanged="onPortalEnvChange"
                        v-if="dropDownValues && selectedPortalEnvIndex !== null"
                    />
                    <Label text="Using Developer Configuration" v-else />
                </StackLayout>
				-->

                <Button class="btn btn-primary btn-padded" :text="_L('uploadDiagnostics')" @tap="uploadDiagnostics" />
                <Button class="btn btn-primary btn-padded" :text="'Sync Portal'" @tap="syncPortal" :isEnabled="!syncing" />

                <Button class="btn btn-primary btn-padded" :text="'Onboarding Flow'" @tap="goOnboardingFlow" />
                <Button class="btn btn-primary btn-padded" :text="'Calibration Flow'" @tap="goCalibrationFlow" />
                <Button class="btn btn-primary btn-padded" :text="'Real Onboarding'" @tap="goOnboarding" />
                <Button class="btn btn-primary btn-padded" :text="_L('resetOnboarding')" @tap="resetOnboarding" />

                <Button class="btn btn-primary btn-padded" text="Stop Discovery" @tap="stopDiscovery" />
                <Button class="btn btn-primary btn-padded" text="Start Discovery" @tap="startDiscovery" />
                <Button class="btn btn-primary btn-padded" text="Restart All Discovery" @tap="restartDiscovery" />

                <StackLayout v-for="(s, i) in status" v-bind:key="i" class="status-messages">
                    <Label :text="s.message" textWrap="true" />
                </StackLayout>

                <Button class="btn btn-primary btn-padded" text="Examine Network" @tap="examineNetwork" :disabled="busy" />

                <!--
                <Button class="btn btn-primary btn-padded" text="Get Sample Data" @tap="downloadSampleData" />
                <Button class="btn btn-primary btn-padded" :text="_L('crash')" @tap="crash" />
                <Button class="btn btn-primary btn-padded" text="Manual Crash" @tap="manualCrash" />
                <Button class="btn btn-primary btn-padded" text="Generate Notifications" @tap="generateNotifications" />
				-->

                <Label :text="_L('appSettings.developer.notice')" textWrap="true" class="danger-notice" />

                <Button class="btn btn-primary btn-padded" :text="_L('deleteDB')" @tap="deleteDB" />
                <Button class="btn btn-primary btn-padded" :text="_L('deleteFiles')" @tap="deleteFiles" />
                <Button class="btn btn-primary btn-padded" text="Forget Uploads" @tap="forgetUploads" />
                <Button class="btn btn-primary btn-padded" text="Forget Downloads" @tap="forgetDownloads" />
            </FlexboxLayout>
        </Scrollview>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import axios from "axios";
import { Dialogs, knownFolders } from "@nativescript/core";
import { ValueList } from "nativescript-drop-down";
import { crashlytics } from "@nativescript/firebase/crashlytics";
import { analytics } from "@nativescript/firebase/analytics";
import Bluebird from "bluebird";

import { serializePromiseChain } from "@/utilities";
import { DownloadsDirectory, getFilePath, getFileName, listAllFiles } from "@/lib/fs";
import routes from "@/routes";
import Services from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import { testWithFiles } from "@/lib/testing";
import { ActionTypes, MutationTypes, PortalEnv, ChangePortalEnvAction } from "@/store";

import Recalibrate from "./onboarding/Recalibrate.vue";
import DiagnosticsModal from "./DiagnosticsModal.vue";
import SharedComponents from "@/components/shared";

interface EnvOption {
    display: string;
    value: string;
    env: PortalEnv;
    selected: boolean;
    index: number;
}

class StatusMessages {
    constructor(public readonly message: string) {}
}

// asdfasdf;
export default Vue.extend({
    data(): {
        status: StatusMessages[];
        syncing: boolean;
        busy: boolean;
    } {
        return {
            status: [],
            syncing: false,
            busy: false,
        };
    },
    components: {
        ...SharedComponents,
        Recalibrate,
    },
    computed: {
        dropDownValues(): ValueList<any> {
            return new ValueList<any>(this.portalEnvs);
        },
        portalEnvs(): EnvOption[] {
            return this.$s.state.portal.availableEnvs
                .filter((e) => e.name != null)
                .map(
                    (env: PortalEnv, index): EnvOption => {
                        if (!env.name) throw new Error(`name is missing`);
                        return {
                            index: index,
                            selected: env.baseUri == this.$s.state.portal.env.baseUri,
                            display: env.name,
                            value: env.name,
                            env: env,
                        };
                    }
                );
        },
        selectedPortalEnvIndex(): number | null {
            const selected = this.portalEnvs.find((e) => e.selected);
            if (!selected) {
                return null;
            }
            return selected.index;
        },
        discoveryRunning(): boolean {
            return Services.DiscoverStation().monitoring;
        },
    },
    methods: {
        onPageLoaded(): Promise<void> {
            return Promise.resolve();
        },
        onPortalEnvChange(ev: { newIndex: number }): Promise<void> {
            console.log("portal-env-change", ev.newIndex);
            const newEnv = this.$s.state.portal.availableEnvs[ev.newIndex];
            return this.$s.dispatch(new ChangePortalEnvAction(newEnv));
        },
        downloadSampleData(): Promise<any> {
            const deviceId = "5e1fd3f938dff63ba5c5f4d29fe84850255191ff";
            const files: string[] = [
                "5e1fd3f938dff63ba5c5f4d29fe84850255191ff/20200831_000000/meta.fkpb",
                "5e1fd3f938dff63ba5c5f4d29fe84850255191ff/20200831_000000/data.fkpb",
            ];

            const progress = (total: number, copied: number, info) => {
                console.log("progress", total, copied);
            };

            return serializePromiseChain(files, (file) => {
                const fullPath = [DownloadsDirectory, getFilePath(file)].join("/");
                const folder = Services.FileSystem().getFolder(fullPath);
                const destination = folder.getFile(getFileName(file));

                return destination.remove().then(() => {
                    console.log("downloading", file);
                    return Services.Conservify()
                        .download({
                            method: "GET",
                            url: "http://192.168.0.100:8000/" + file,
                            path: destination.path,
                            progress: progress,
                        })
                        .catch((error) => {
                            console.log("error", file, error);
                            throw error;
                        })
                        .then((response) => {
                            console.log("status", file, response.statusCode);
                            return destination.path;
                        });
                });
            })
                .then((all) => this.listPhoneFiles(DownloadsDirectory).then(() => all))
                .then((all) => testWithFiles(deviceId));
        },
        syncPortal(): Promise<any> {
            this.syncing = true;
            return Services.PortalUpdater()
                .addOrUpdateStations()
                .then(() => {
                    return alert({
                        title: _L("devOptions"),
                        message: "Done",
                        okButtonText: _L("ok"),
                    });
                })
                .finally(() => {
                    this.syncing = false;
                });
        },
        async forgetUploads(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }

            await Services.Database()
                .forgetUploads()
                .then(() => {
                    return Services.Store()
                        .dispatch(ActionTypes.LOAD)
                        .then(() => {
                            return alert({
                                title: _L("devOptions"),
                                message: "Done",
                                okButtonText: _L("ok"),
                            });
                        });
                });
        },
        async forgetDownloads(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }

            await Services.Database()
                .forgetDownloads()
                .then(() => {
                    return Services.Store()
                        .dispatch(ActionTypes.LOAD)
                        .then(() => {
                            return alert({
                                title: _L("devOptions"),
                                message: "Done",
                                okButtonText: _L("ok"),
                            });
                        });
                });
        },
        async startDiscovery(): Promise<void> {
            await Services.DiscoverStation().startServiceDiscovery();
        },
        async stopDiscovery(): Promise<void> {
            await Services.DiscoverStation().stopServiceDiscovery({ suspending: false });
        },
        async restartDiscovery(): Promise<void> {
            await Services.DiscoverStation().restart();
        },
        viewStations(): Promise<any> {
            return this.$navigateTo(routes.stations, { clearHistory: true });
        },
        goOnboardingFlow(): Promise<any> {
            return this.$navigateTo(routes.reader.flow, {
                frame: "outer-frame",
                props: {
                    flowName: "onboarding",
                },
            });
        },
        goCalibrationFlow(): Promise<any> {
            return this.$navigateTo(routes.reader.flow, {
                frame: "outer-frame",
                props: {
                    flowName: "calibration",
                },
            });
        },
        goOnboarding(): Promise<any> {
            return this.$navigateTo(routes.onboarding.assembleStation, {});
        },
        superConfirm(): Promise<boolean> {
            return Dialogs.confirm({
                title: "Are you sure?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            }).then((yesNo) => {
                if (yesNo) {
                    return Dialogs.confirm({
                        title: "Are really you sure?",
                        okButtonText: _L("yes"),
                        cancelButtonText: _L("no"),
                    });
                }
                return false;
            });
        },
        resetOnboarding(): Promise<any> {
            const appSettings = new AppSettings();
            appSettings.remove("completedSetup");
            appSettings.remove("skipCount");
            return Dialogs.confirm({
                title: _L("resetDoneGoToOnboarding"),
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            }).then((result) => {
                if (result) {
                    // navigate to onboarding
                    this.$navigateTo(routes.onboarding.assembleStation, {});
                }
            });
        },
        uploadDiagnostics(): Promise<any> {
            return this.$showModal(DiagnosticsModal, {
                props: {},
            });
        },
        async deleteDB(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }

            console.log("deleting database");

            await Services.CreateDb()
                .initialize(null, true, false)
                .then(() => {
                    const store = Services.Store();

                    console.log("database deleted");

                    store.commit(MutationTypes.RESET);

                    return Services.Store()
                        .dispatch(ActionTypes.LOAD)
                        .then(() => {
                            return alert({
                                title: _L("devOptions"),
                                message: _L("dbDeleted"),
                                okButtonText: _L("ok"),
                            });
                        });
                });
        },
        listPhoneFiles(path: string): Promise<any> {
            return listAllFiles(path).then((fs) => {
                return fs.map((e) => {
                    console.log(e.path);
                });
            });
        },
        async deleteFiles(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }
            const rootFolder = knownFolders.documents();
            const diagnosticsFolder = rootFolder.getFolder("diagnostics");
            const firmwareFolder = rootFolder.getFolder("firmware");
            const oldDataFolder = rootFolder.getFolder("FieldKitData");
            const downloadsFolder = rootFolder.getFolder(DownloadsDirectory);

            await Promise.all([firmwareFolder.clear(), diagnosticsFolder.clear(), downloadsFolder.clear(), oldDataFolder.clear()])
                .catch((res) => {
                    console.log("error removing files", res, res ? res.stack : null);

                    alert({
                        title: _L("devOptions"),
                        message: _L("errorRemovingFiles"),
                        okButtonText: _L("ok"),
                    });
                })
                .then((res) => {
                    return listAllFiles();
                })
                .then((after) => {
                    console.log(
                        "files after deletion",
                        _(after)
                            .map((f) => f.path)
                            .value()
                    );

                    return alert({
                        title: _L("devOptions"),
                        message: _L("filesRemoved"),
                        okButtonText: _L("ok"),
                    });
                });
        },
        crash(): void {
            console.log("send crash");
            crashlytics.crash();
        },
        manualCrash(): void {
            console.log("send manual crash");
            const globalAny: any = global;
            crashlytics.sendCrashLog(new globalAny.java.lang.Exception("hello, fake crash"));
            analytics.logEvent({
                key: "app_crash_manual",
            });
        },
        generateNotifications(): void {
            console.log("generate notifications");
            const store = Services.Store();

            store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: "2/1/station-deployed",
                kind: "station-deployed",
                created: new Date(),
                silenced: false,
                project: {},
                user: store.state.portal?.currentUser,
                station: {},
                actions: {},
            });

            store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: "2/1/authentication",
                kind: "authentication",
                created: new Date(),
                silenced: false,
                project: {},
                user: store.state.portal?.currentUser,
                station: {},
                actions: {},
            });

            store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: "2/1/unknown",
                kind: "unknown",
                created: new Date(),
                silenced: false,
                project: {},
                user: store.state.portal?.currentUser,
                station: {},
                actions: {},
            });
        },
        async examineNetwork(): Promise<void> {
            console.log(`examining network`);

            this.busy = true;

            this.update("Examining network...");

            await Bluebird.delay(500);

            const url = "http://192.168.2.1";

            try {
                const conservify = Services.Conservify();
                this.update(`Querying ${url} (conservify)...`);
                const response = await conservify.text({ url: url });
                this.update("Success!");
                this.update(response.body.toString());
                console.log(`${url}: ${JSON.stringify(response)}`);
            } catch (error) {
                this.update(`Error: ${JSON.stringify(error)}`);
            }

            try {
                const abort = axios.CancelToken.source();
                const id = setTimeout(() => abort.cancel("timeout"), 3000);
                this.update(`Querying ${url} (axios)...`);
                const response = await axios.request({ url: url, timeout: 3000, cancelToken: abort.token });
                clearTimeout(id);
                this.update("Success!");
                this.update(response?.data?.toString() || "");
                console.log(`${url}: ${JSON.stringify(response)}`);
            } catch (error) {
                this.update(`Error: ${JSON.stringify(error)}`);
            }

            await Bluebird.delay(500);

            this.update("Done.");

            this.busy = false;
        },
        update(message: string): void {
            console.log(`examine: ${message}`);
            this.status.push(new StatusMessages(message));
        },
    },
});
</script>

<style scoped lang="scss">
// Start custom common variables
@import "~/_app-variables";
// End custom common variables

// Custom styles
.spacer {
    border-top-color: $fk-gray-border;
    border-top-width: 2;
}
.drop-down {
    padding: 8;
    background-color: white;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}

.status-messages {
    padding-left: 20;
    padding-right: 20;
}

.danger-notice {
    color: $fk-primary-black;
    padding-left: 20;
    padding-right: 20;
    line-height: 4;
}
</style>
