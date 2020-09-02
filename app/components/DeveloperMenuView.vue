<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader title="Developer" :canNavigateBack="false" :canNavigateSettings="false" />
        <Scrollview>
            <FlexboxLayout flexDirection="column" class="p-t-10">
                <Label v-if="loggedIn" class="plain m-20 text-center" :text="message" textWrap="true"></Label>
                <Button class="btn btn-primary btn-padded" :text="_L('viewStations')" @tap="viewStations"></Button>
                <StackLayout class="spacer m-t-30"></StackLayout>
                <StackLayout class="m-x-20 m-b-20">
                    <Label class="m-y-10" textWrap="true" :text="_L('currentEnvironment') + ': ' + environmentLabels[currentEnv]" />
                    <GridLayout rows="auto" columns="200" horizontalAlignment="center">
                        <DropDown
                            row="0"
                            col="0"
                            class="p-l-5 p-b-2 size-18 drop-down"
                            :items="environmentLabels"
                            :selectedIndex="currentEnv"
                            id="env-drop-down"
                            @opened="onOpened"
                            @selectedIndexChanged="onDropDownSelection"
                        ></DropDown>
                        <Image
                            row="0"
                            col="0"
                            width="15"
                            class="m-r-5"
                            horizontalAlignment="right"
                            verticalAlignment="middle"
                            src="~/images/Icon_Cheveron_Down.png"
                            @tap="openDropDown"
                        />
                    </GridLayout>
                </StackLayout>
                <Button class="btn btn-primary btn-padded" :text="'Sync Portal'" @tap="syncPortal" :isEnabled="!syncing" />

                <Button class="btn btn-primary btn-padded" :text="'Onboarding'" @tap="goOnboarding" />
                <Button class="btn btn-primary btn-padded" :text="_L('resetOnboarding')" @tap="resetOnboarding" />
                <Button class="btn btn-primary btn-padded" :text="_L('uploadDiagnostics')" @tap="uploadDiagnostics" />

                <Button class="btn btn-primary btn-padded" text="Get Sample Data" @tap="downloadSampleData" />
                <Button class="btn btn-primary btn-padded" text="Forget Uploads" @tap="forgetUploads" />

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
import Firebase from "nativescript-plugin-firebase";
import { crashlytics } from "nativescript-plugin-firebase";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { knownFolders } from "tns-core-modules/file-system";
import { listAllFiles } from "@/lib/fs";
import Config from "@/config";
import routes from "@/routes";
import Services from "@/services/services";
import Recalibrate from "./onboarding/Recalibrate";
import AppSettings from "@/wrappers/app-settings";
import * as ActionTypes from "@/store/actions";
import * as MutationTypes from "@/store/mutations";

import { getFilePath, getFileName, serializePromiseChain } from "@/utilities";

import SharedComponents from "@/components/shared";
import DiagnosticsModal from "./DiagnosticsModal.vue";

import { testWithFiles } from "@/lib/data";

export default Vue.extend({
    data(this: any) {
        return {
            syncing: false,
            message: _L("devOptions"),
            loggedIn: Services.PortalInterface().isLoggedIn(),
            currentEnv: 0,
            environments: [
                {
                    uri: "https://api.fkdev.org",
                    label: "Development",
                },
                {
                    uri: "https://api.fieldkit.org",
                    label: "Production",
                },
            ],
            environmentLabels: [],
            stations: [],
        };
    },
    components: {
        ...SharedComponents,
        Recalibrate,
    },
    methods: {
        onPageLoaded(this: any, args) {
            this.page = args.object;

            return Services.Database()
                .getConfig()
                .then((result) => {
                    if (result.length == 0) {
                        console.log("DeveloperMenuView did not get config from db. Using config.js", Config);
                        this.config = Config;
                    } else {
                        this.config = result[0];
                    }
                    const baseUri = this.config.baseUri;
                    this.currentEnv = this.environments.findIndex((env) => {
                        return env.uri == baseUri;
                    });
                    if (this.currentEnv == -1) {
                        this.environments.push({
                            uri: baseUri,
                            label: "Local",
                        });
                        this.currentEnv = this.environments.length - 1;
                    }
                    this.environmentLabels = this.environments.map((env) => {
                        return env.label;
                    });
                });
        },
        downloadSampleData(this: any) {
            const deviceId = "5e1fd3f938dff63ba5c5f4d29fe84850255191ff";
            const files: string[] = [
                "5e1fd3f938dff63ba5c5f4d29fe84850255191ff/20200831_000000/meta.fkpb",
                "5e1fd3f938dff63ba5c5f4d29fe84850255191ff/20200831_000000/data.fkpb",
            ];

            const progress = (total: number, copied: number, info) => {
                console.log("progress", total, copied);
            };

            return serializePromiseChain(files, (file) => {
                const fullPath = ["downloads", getFilePath(file)].join("/");
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
                .then((all) => this.listPhoneFiles("downloads").then(() => all))
                .then((all) => testWithFiles(Services, deviceId));
        },
        syncPortal(this: any) {
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
        forgetUploads(this: any) {
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
        viewStations(this: any) {
            this.$navigateTo(routes.stations);
        },
        openDropDown(this: any, event) {
            const dropDown = this.page.getViewById("env-drop-down");
            dropDown.open();
        },
        onOpened(this: any, event) {
            // provide feedback by changing background color
            event.object.backgroundColor = "#F4F5F7";
            setTimeout(() => {
                event.object.backgroundColor = "white";
            }, 500);
        },
        onDropDownSelection(this: any, event) {
            this.currentEnv = event.newIndex;
            const baseUri = this.environments[this.currentEnv].uri;
            const params = {
                baseUri: baseUri,
                ingestionUri: baseUri + "/ingestion",
                id: this.config.id,
            };
            return Services.Database()
                .updateConfigUris(params)
                .then(() => Services.PortalInterface().logout());
        },
        goOnboarding(this: any) {
            return this.$navigateTo(routes.onboarding.assembleStation);
        },
        resetOnboarding(this: any) {
            const appSettings = new AppSettings();
            appSettings.remove("completedSetup");
            appSettings.remove("skipCount");
            dialogs
                .confirm({
                    title: _L("resetDoneGoToOnboarding"),
                    okButtonText: _L("yes"),
                    cancelButtonText: _L("no"),
                })
                .then((result) => {
                    if (result) {
                        // navigate to onboarding
                        this.$navigateTo(routes.onboarding.assembleStation);
                    }
                });
        },
        uploadDiagnostics(this: any) {
            this.$showModal(DiagnosticsModal, {
                props: {},
            });
        },
        deleteDB(this: any) {
            console.log("deleting database");

            return Services.CreateDb()
                .initialize(true)
                .then(() => {
                    const store = Services.Store();

                    console.log("database deleted");

                    store.commit(MutationTypes.RESET);

                    store.commit(MutationTypes.SERVICES, () => Services);

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
        listPhoneFiles(this: any, path: string) {
            const rootFolder = knownFolders.documents();
            return listAllFiles(rootFolder.getFolder(path)).then((fs) => {
                return fs.map((e) => {
                    console.log(e.path, e.size);
                });
            });
        },
        deleteFiles(this: any) {
            const rootFolder = knownFolders.documents();
            const diagnosticsFolder = rootFolder.getFolder("diagnostics");
            const firmwareFolder = rootFolder.getFolder("firmware");
            const oldDataFolder = rootFolder.getFolder("FieldKitData");
            const downloadsFolder = rootFolder.getFolder("downloads");

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
                    return listAllFiles(rootFolder);
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
        crash(this: any) {
            console.log("send crash");
            crashlytics.crash();
        },
        manualCrash(this: any) {
            console.log("send manual crash");
            const globalAny: any = global;
            crashlytics.sendCrashLog(new globalAny.java.lang.Exception("hello, fake crash"));
            Firebase.analytics.logEvent({
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
