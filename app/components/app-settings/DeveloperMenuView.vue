<template>
    <Page>
        <PlatformHeader title="Developer" :canNavigateSettings="false" />
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <StackLayout class="m-x-20 m-b-20" v-if="beta">
                    <DropDown
                        class="drop-down"
                        :items="dropDownValues"
                        :selectedIndex="selectedPortalEnvIndex"
                        @selectedIndexChanged="onPortalEnvChange"
                        v-if="dropDownValues && selectedPortalEnvIndex !== null"
                    />
                    <Label text="Using Developer Configuration" v-else />
                </StackLayout>

                <Button class="btn btn-primary btn-padded" :text="_L('uploadDiagnostics')" @tap="uploadDiagnostics" />
                <Button class="btn btn-primary btn-padded" :text="'Sync Portal'" @tap="syncPortal" :isEnabled="!syncing" />

                <Button class="btn btn-primary btn-padded" :text="'Real Onboarding'" @tap="goOnboarding" v-if="beta" />
                <Button class="btn btn-primary btn-padded" :text="_L('resetOnboarding')" @tap="resetOnboarding" v-if="beta" />

                <Button class="btn btn-primary btn-padded" text="Stop Discovery" @tap="stopDiscovery" v-if="beta" />
                <Button class="btn btn-primary btn-padded" text="Start Discovery" @tap="startDiscovery" v-if="beta" />
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

                <Button class="btn btn-primary btn-padded" text="Reset Logs" @tap="deleteLogs" />
                <Button class="btn btn-primary btn-padded" text="Reset Data" @tap="deleteAll" />
                <Button class="btn btn-primary btn-padded" text="Forget Uploads" @tap="forgetUploads" />
                <Button class="btn btn-primary btn-padded" text="Forget Downloads" @tap="forgetDownloads" />

                <Button class="btn btn-primary btn-padded" text="Zones" @tap="testZones" v-if="false" />

                <Button class="btn btn-primary btn-padded" text="Flows" @tap="loadFlows" v-if="beta" :isEnabled="!busy" />

                <StackLayout v-for="(name, i) in flowNames" v-bind:key="i" class="flows" v-if="beta && flows">
                    <Button class="btn btn-primary btn-padded flow" :text="'Flow: ' + name" @tap="openFlow(name)" />
                </StackLayout>
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
import Config from "@/config";

import {
    _L,
    promiseAfter,
    serializePromiseChain,
    DownloadsDirectory,
    getFilePath,
    getFileName,
    listAllFiles,
    testWithFiles,
    zoned,
    getZone,
    truncateLogs,
} from "@/lib";

import { fullRoutes, FullRoute } from "@/routes";
import Services from "@/services/singleton";
import AppSettings from "@/wrappers/app-settings";
import { ActionTypes, MutationTypes, PortalEnv, ChangePortalEnvAction } from "@/store";

import DiagnosticsModal from "./DiagnosticsModal.vue";
import SharedComponents from "@/components/shared";

import { FlowFile, getFlowNames } from "@/reader/model";
import { download } from "@/reader/download";

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

export default Vue.extend({
    data(): {
        status: StatusMessages[];
        syncing: boolean;
        busy: boolean;
        flows: FlowFile | null;
    } {
        return {
            status: [],
            syncing: false,
            busy: false,
            flows: null,
        };
    },
    components: {
        ...SharedComponents,
    },
    computed: {
        beta(): boolean {
            return Config.beta;
        },
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
        flowNames(): string[] {
            if (this.flows) {
                return getFlowNames(this.flows);
            }
            return [];
        },
    },
    mounted() {
        void this.loadFlows();
    },
    methods: {
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
                    return Dialogs.alert({
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
                            return Dialogs.alert({
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
                            return Dialogs.alert({
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
        async openFlow(name: string): Promise<void> {
            await this.$navigateTo(
                fullRoutes.flow({
                    flow: {
                        name: name,
                    },
                    finished: new FullRoute("tabbed", "outer-frame", {}),
                    skipped: new FullRoute("tabbed", "outer-frame", {}),
                })
            );
        },
        async loadFlows(): Promise<void> {
            this.busy = true;
            this.flows = await download("https://strapi.conservify.org");
            this.busy = false;
        },
        async goOnboarding(): Promise<void> {
            void this.$navigateTo(fullRoutes.onboarding.assemble);
        },
        superConfirm(): Promise<boolean> {
            return Dialogs.confirm({
                title: "Are you sure?",
                okButtonText: _L("yes"),
                cancelButtonText: _L("no"),
            }).then((yesNo) => {
                if (yesNo) {
                    return Dialogs.confirm({
                        title: "Are really you sure? This is irreversible.",
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
            }).then((yesNo) => {
                if (yesNo) {
                    void this.$navigateTo(fullRoutes.onboarding.assemble);
                }
            });
        },
        uploadDiagnostics(): Promise<any> {
            return this.$showModal(DiagnosticsModal, {
                props: {},
            });
        },
        async deleteLogs(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }

            await truncateLogs();

            await Dialogs.alert({
                title: _L("devOptions"),
                message: "Logs deleted.",
                okButtonText: _L("ok"),
            });
        },
        async deleteAll(): Promise<void> {
            const confirmation = await this.superConfirm();
            if (!confirmation) {
                return;
            }

            await this.deleteDB();
            await this.deleteFiles();

            await Dialogs.alert({
                title: _L("devOptions"),
                message: _L("dbDeleted"),
                okButtonText: _L("ok"),
            });
        },
        async deleteDB(): Promise<void> {
            console.log("deleting database");

            await Services.CreateDb()
                .initialize(null, true, false)
                .then(() => {
                    const store = Services.Store();

                    console.log("database deleted");

                    store.commit(MutationTypes.RESET);

                    return Services.Store()
                        .dispatch(ActionTypes.LOAD)
                        .then(() => {});
                });
        },
        async deleteFiles(): Promise<void> {
            const rootFolder = knownFolders.documents();
            const diagnosticsFolder = rootFolder.getFolder("diagnostics");
            const firmwareFolder = rootFolder.getFolder("firmware");
            const oldDataFolder = rootFolder.getFolder("FieldKitData");
            const downloadsFolder = rootFolder.getFolder(DownloadsDirectory);

            await Promise.all([firmwareFolder.clear(), diagnosticsFolder.clear(), downloadsFolder.clear(), oldDataFolder.clear()])
                .catch((res) => {
                    console.log("error removing files", res, res ? res.stack : null);

                    Dialogs.alert({
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
                });
        },
        listPhoneFiles(path: string): Promise<any> {
            return listAllFiles(path).then((fs) => {
                return fs.map((e) => {
                    console.log(e.path);
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
                station: { id: 1 },
                actions: {},
            });

            store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: "2/1/authentication",
                kind: "authentication",
                created: new Date(),
                silenced: false,
                project: {},
                user: store.state.portal?.currentUser,
                station: { id: 1 },
                actions: {},
            });

            store.dispatch(ActionTypes.ADD_NOTIFICATION, {
                key: "2/1/unknown",
                kind: "unknown",
                created: new Date(),
                silenced: false,
                project: {},
                user: store.state.portal?.currentUser,
                station: { id: 1 },
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
        async testZones(): Promise<void> {
            const Zone = getZone();
            console.log("have Zone", Zone.current.name);
            await zoned({}, async () => {
                await this.asyncExamples();
            });
        },
        async asyncExamples(): Promise<void> {
            console.log("starting");
            try {
                console.log("test-after begin");
                await promiseAfter(1000).then(() => {
                    console.log("test-after");
                });
                console.log("test-after done");
            } catch (error) {
                console.log("test-after error", error);
            }

            try {
                console.log("test-ctor begin");
                await new Promise((resolve) => {
                    console.log("test-ctor");
                    resolve("done");
                });
                console.log("test-ctor done");
            } catch (error) {
                console.log("test-ctor error", error);
            }

            try {
                console.log("test-reject begin");
                await new Promise((resolve, reject) => {
                    console.log("test-reject");
                    reject("fail");
                });
                console.log("test-reject done");
            } catch (error) {
                console.log("test-reject error", error);
            }

            try {
                console.log("test-axios begin");
                const response = await axios.request({ url: "https://api.fieldkit.org/status", timeout: 3000 });
                console.log("test-axios done", response.data);
            } catch (error) {
                console.log("test-axios error", error);
            }
            console.log("done");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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

.flows {
    .flow {
        background-color: orange;
    }
}
</style>
