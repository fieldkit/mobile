<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader title="Developer" :canNavigateBack="false" :canNavigateSettings="false" />
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <Button class="btn btn-primary btn-padded" :text="_L('viewStations')" @tap="viewStations"></Button>

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

                <Button class="btn btn-primary btn-padded" :text="'Sync Portal'" @tap="syncPortal" :isEnabled="!syncing" />

                <Button class="btn btn-primary btn-padded" :text="'Onboarding Flow'" @tap="goOnboardingFlow" />
                <Button class="btn btn-primary btn-padded" :text="'Calibration Flow'" @tap="goCalibrationFlow" />
                <Button class="btn btn-primary btn-padded" :text="'Real Onboarding'" @tap="goOnboarding" />
                <Button class="btn btn-primary btn-padded" :text="_L('resetOnboarding')" @tap="resetOnboarding" />
                <Button class="btn btn-primary btn-padded" :text="_L('uploadDiagnostics')" @tap="uploadDiagnostics" />

                <Button class="btn btn-primary btn-padded" text="Get Sample Data" @tap="downloadSampleData" />
                <Button class="btn btn-primary btn-padded" text="Forget Uploads" @tap="forgetUploads" />
                <Button class="btn btn-primary btn-padded" text="Forget Downloads" @tap="forgetDownloads" />

                <Button class="btn btn-primary btn-padded" :text="_L('deleteDB')" @tap="deleteDB" />
                <Button class="btn btn-primary btn-padded" :text="_L('deleteFiles')" @tap="deleteFiles" />

                <Button class="btn btn-primary btn-padded" :text="_L('crash')" @tap="crash" />
                <Button class="btn btn-primary btn-padded" text="Manual Crash" @tap="manualCrash" />
            </FlexboxLayout>
        </Scrollview>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import _ from "lodash";
import { Dialogs, knownFolders } from "@nativescript/core";
import { ValueList } from "nativescript-drop-down";
import { crashlytics } from "@nativescript/firebase/crashlytics";
import { analytics } from "@nativescript/firebase/analytics";

import { getFilePath, getFileName, serializePromiseChain } from "@/utilities";
import { DownloadsDirectory, listAllFiles } from "@/lib/fs";
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

export default Vue.extend({
    data(): { syncing: boolean } {
        return {
            syncing: false,
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
            return this.$store.state.portal.availableEnvs.map(
                (env, index): EnvOption => {
                    return {
                        index: index,
                        selected: env.baseUri == this.$store.state.portal.env.baseUri,
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
    },
    methods: {
        onPageLoaded(): Promise<void> {
            return Promise.resolve();
        },
        onPortalEnvChange(ev: { newIndex: number }): Promise<void> {
            console.log("portal-env-change", ev.newIndex);
            const newEnv = this.$store.state.portal.availableEnvs[ev.newIndex];
            return this.$store.dispatch(new ChangePortalEnvAction(newEnv));
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
                            return {};
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
        forgetUploads(): Promise<any> {
            return Services.Database()
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
        forgetDownloads(): Promise<any> {
            return Services.Database()
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
        viewStations(): Promise<any> {
            return this.$navigateTo(routes.stations, {});
        },
        goOnboardingFlow(): Promise<any> {
            return this.$navigateTo(routes.reader.flow, {
                props: {
                    flowName: "onboarding",
                },
            });
        },
        goCalibrationFlow(): Promise<any> {
            return this.$navigateTo(routes.reader.flow, {
                props: {
                    flowName: "calibration",
                },
            });
        },
        goOnboarding(): Promise<any> {
            return this.$navigateTo(routes.onboarding.assembleStation, {});
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
        deleteDB(): Promise<any> {
            console.log("deleting database");

            return Services.CreateDb()
                .initialize(true)
                .then(() => {
                    const store = Services.Store();

                    console.log("database deleted");

                    store.commit(MutationTypes.RESET);

                    return Services.Store()
                        .dispatch(ActionTypes.INITIALIZE)
                        .then(() => {
                            return store.dispatch(ActionTypes.LOAD).then(() => {
                                return alert({
                                    title: _L("devOptions"),
                                    message: _L("dbDeleted"),
                                    okButtonText: _L("ok"),
                                });
                            });
                        });
                });
        },
        listPhoneFiles(path: string): Promise<any> {
            return listAllFiles(path).then((fs) => {
                return fs.map((e) => {
                    console.log(e.path, e.size);
                });
            });
        },
        deleteFiles(): Promise<any> {
            const rootFolder = knownFolders.documents();
            const diagnosticsFolder = rootFolder.getFolder("diagnostics");
            const firmwareFolder = rootFolder.getFolder("firmware");
            const oldDataFolder = rootFolder.getFolder("FieldKitData");
            const downloadsFolder = rootFolder.getFolder(DownloadsDirectory);

            return Promise.all([firmwareFolder.clear(), diagnosticsFolder.clear(), downloadsFolder.clear(), oldDataFolder.clear()])
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
</style>
