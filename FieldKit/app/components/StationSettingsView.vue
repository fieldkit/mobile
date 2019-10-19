<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,70">
            <ScrollView row="0">
                <FlexboxLayout
                    flexDirection="column"
                    justifyContent="space-between"
                    class="p-t-10"
                >
                    <GridLayout
                        rows="auto"
                        columns="15*,70*,15*"
                        class="bottom-border p-b-10"
                    >
                        <StackLayout
                            col="0"
                            class="round-bkgd"
                            verticalAlignment="top"
                            @tap="goBack"
                        >
                            <Image
                                width="21"
                                src="~/images/Icon_backarrow.png"
                            ></Image>
                        </StackLayout>
                        <GridLayout col="1" rows="auto,auto" columns="*">
                            <Label
                                row="0"
                                class="size-20 m-y-0 text-center"
                                text="Station Settings"
                                textWrap="true"
                            ></Label>
                            <Label
                                row="1"
                                class="text-center size-14"
                                :text="station.name"
                                textWrap="true"
                            ></Label>
                        </GridLayout>
                        <StackLayout col="2" class="placeholder"></StackLayout>
                    </GridLayout>

                    <!-- edit station name -->
                    <WrapLayout orientation="horizontal" class="m-10">
                        <Image
                            class="m-10"
                            width="17"
                            v-show="isEditingName"
                            @tap="cancelRename"
                            src="~/images/Icon_Close.png"
                        ></Image>
                        <Label
                            class="station-name text-center size-20"
                            :text="station.name"
                            v-show="!isEditingName"
                            textWrap="true"
                        ></Label>
                        <TextField
                            class="input size-20"
                            :isEnabled="true"
                            keyboardType="name"
                            autocorrect="false"
                            autocapitalizationType="none"
                            v-model="station.name"
                            v-show="isEditingName"
                            returnKeyType="next"
                            @blur="checkName"
                        ></TextField>
                        <Label
                            class="size-10 char-count"
                            :text="station.name.length"
                            v-show="isEditingName"
                        ></Label>
                        <Image
                            class="m-l-10"
                            width="18"
                            v-show="!isEditingName"
                            @tap="startRename"
                            src="~/images/Icon_Edit.png"
                        ></Image>
                        <Image
                            class="m-10"
                            width="17"
                            v-show="isEditingName"
                            @tap="saveStationName"
                            src="~/images/Icon_Save.png"
                        ></Image>
                        <!-- validation errors -->
                        <Label
                            class="validation-error"
                            id="no-name"
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"
                        ></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"
                        ></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            :text="_L('nameNotPrintable')"
                            textWrap="true"
                            :visibility="
                                nameNotPrintable ? 'visible' : 'collapsed'
                            "
                        ></Label>
                        <!-- end edit name form -->
                        <Label
                            :text="'Firmware: ' + versions.firmware"
                            class="size-16 full-width m-t-10"
                        />
                        <Label
                            :text="'Firmware build: ' + versions.firmwareBuild"
                            class="size-16 full-width"
                        />
                        <Label
                            :text="'Device ID: ' + versions.device"
                            class="size-16 full-width"
                        />
                        <Label
                            :text="'App build time: ' + versions.appBuildTime"
                            class="size-16 full-width"
                        />
                        <Label
                            :text="
                                'App build number: ' + versions.appBuildNumber
                            "
                            class="size-16 full-width"
                        />
                        <Label
                            :text="'Build Tag: ' + versions.appBuildTag"
                            class="size-16 full-width"
                        />
                        <Label
                            :text="'Commit: ' + versions.appCommit"
                            class="size-16 full-width"
                        />
                        <Label
                            :text="'Branch: ' + versions.appBranch"
                            class="size-16 full-width"
                        />
                    </WrapLayout>
                    <StackLayout class="section-border"></StackLayout>

                    <!-- stop deployment button -->
                    <StackLayout
                        class="m-x-10"
                        v-if="station.status == 'recording'"
                    >
                        <Label
                            text="End Deployment"
                            class="size-20 m-y-5 full-width"
                        />
                        <Label
                            text="To undeploy and stop recording data, you must be connected to your station."
                            class="size-16 m-y-5"
                            textWrap="true"
                        />
                        <Button
                            class="btn btn-primary full-width"
                            text="Stop Recording"
                            @tap="stopRecording"
                        ></Button>
                    </StackLayout>
                    <StackLayout
                        class="section-border"
                        v-if="station.status == 'recording'"
                    ></StackLayout>

                    <!-- add/remove networks -->
                    <StackLayout class="m-x-10">
                        <Label text="WiFi Networks" class="size-20"></Label>
                        <GridLayout
                            rows="auto"
                            columns="75*,25*"
                            v-for="n in networks"
                            :key="n.ssid"
                        >
                            <Label
                                :text="n.ssid"
                                col="0"
                                class="m-l-15 m-y-10"
                            ></Label>
                            <Image
                                col="1"
                                src="~/images/Icon_Close.png"
                                width="17"
                                :dataSsid="n.ssid"
                                @tap="removeNetwork"
                            ></Image>
                        </GridLayout>

                        <GridLayout
                            v-if="!addingNetwork"
                            rows="auto"
                            columns="10*,90*"
                            @tap="showNetworkForm"
                        >
                            <Image
                                col="0"
                                src="~/images/add.png"
                                width="30"
                            ></Image>
                            <Label
                                col="1"
                                text="Add a network to station"
                                class="size-16"
                            ></Label>
                        </GridLayout>

                        <StackLayout v-if="addingNetwork">
                            <GridLayout rows="auto,auto,auto" columns="35*,65*">
                                <Label
                                    row="0"
                                    col="0"
                                    text="Network name: "
                                    verticalAlignment="middle"
                                    class="text-right"
                                ></Label>
                                <TextField
                                    row="0"
                                    col="1"
                                    class="network-input"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="newNetwork.ssid"
                                    returnKeyType="next"
                                ></TextField>
                                <Label
                                    row="1"
                                    col="0"
                                    text="Password: "
                                    verticalAlignment="middle"
                                    class="text-right"
                                ></Label>
                                <TextField
                                    row="1"
                                    col="1"
                                    class="network-input"
                                    secure="true"
                                    ref="password"
                                    v-model="newNetwork.password"
                                    returnKeyType="done"
                                ></TextField>
                                <Button
                                    row="2"
                                    colSpan="2"
                                    class="btn btn-secondary"
                                    text="Add"
                                    @tap="addNetwork"
                                ></Button>
                            </GridLayout>
                        </StackLayout>
                    </StackLayout>
                    <StackLayout class="section-border"></StackLayout>

                    <!-- edit LoRa -->
                    <StackLayout class="m-x-10" v-if="haveLora">
                        <Label
                            text="LoRa (Long Range) Network"
                            class="size-20"
                        ></Label>
                        <Label
                            :text="'Device EUI: ' + lora.deviceEui"
                            col="0"
                            class="m-l-15 m-y-10"
                        ></Label>

                        <GridLayout
                            rows="auto"
                            columns="10*,90*"
                            @tap="showLoraForm"
                        >
                            <Image
                                col="0"
                                src="~/images/add.png"
                                width="30"
                            ></Image>
                            <Label
                                col="1"
                                text="Edit App EUI and Key"
                                class="size-16"
                            ></Label>
                        </GridLayout>

                        <StackLayout v-if="editingLora">
                            <GridLayout
                                rows="auto,auto,auto,auto,auto"
                                columns="35*,65*"
                            >
                                <Label
                                    row="0"
                                    col="0"
                                    text="App EUI: "
                                    verticalAlignment="middle"
                                    class="text-right"
                                ></Label>
                                <TextField
                                    row="0"
                                    col="1"
                                    class="network-input"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="lora.appEui"
                                    returnKeyType="next"
                                ></TextField>
                                <Label
                                    row="1"
                                    col="1"
                                    class="validation-error m-l-10"
                                    text="Invalid App EUI"
                                    textWrap="true"
                                    :visibility="
                                        invalidEui ? 'visible' : 'collapsed'
                                    "
                                ></Label>
                                <Label
                                    row="2"
                                    col="0"
                                    text="App Key: "
                                    verticalAlignment="middle"
                                    class="text-right"
                                ></Label>
                                <TextField
                                    row="2"
                                    col="1"
                                    class="network-input"
                                    autocorrect="false"
                                    autocapitalizationType="none"
                                    v-model="lora.appKey"
                                    returnKeyType="done"
                                ></TextField>
                                <Label
                                    row="3"
                                    col="1"
                                    class="validation-error m-l-10"
                                    text="Invalid App Key"
                                    textWrap="true"
                                    :visibility="
                                        invalidKey ? 'visible' : 'collapsed'
                                    "
                                ></Label>
                                <Button
                                    row="4"
                                    colSpan="2"
                                    class="btn btn-secondary"
                                    text="Submit"
                                    @tap="editLora"
                                ></Button>
                            </GridLayout>
                        </StackLayout>
                    </StackLayout>
                    <StackLayout
                        class="section-border"
                        v-if="haveLora"
                    ></StackLayout>

                    <!-- links to module settings -->
                    <StackLayout class="full-width">
                        <GridLayout
                            rows="auto"
                            columns="*"
                            v-for="m in station.moduleObjects"
                            :key="m.id"
                        >
                            <StackLayout
                                class="y-bordered-container p-10 m-x-10 m-y-1"
                            >
                                <!-- top row of module list -->
                                <GridLayout rows="auto" columns="15*,70*,15*">
                                    <!-- module icon -->
                                    <Image
                                        row="0"
                                        col="0"
                                        width="40"
                                        horizontalAlignment="left"
                                        :src="
                                            m.name.indexOf('Water') > -1
                                                ? '~/images/Icon_Water_Module.png'
                                                : m.name.indexOf('Weather') > -1
                                                ? '~/images/Icon_Weather_Module.png'
                                                : '~/images/Icon_Generic_Module.png'
                                        "
                                    ></Image>
                                    <!-- module name -->
                                    <Label
                                        row="0"
                                        col="1"
                                        :text="m.name"
                                        verticalAlignment="center"
                                        class="module-name"
                                        textWrap="true"
                                    />
                                    <!-- links to config -->
                                    <Image
                                        row="0"
                                        col="2"
                                        width="30"
                                        horizontalAlignment="right"
                                        src="~/images/pointing_right.png"
                                        :dataId="'m_id-' + m.id"
                                        @tap="goToModuleConfig"
                                    ></Image>
                                </GridLayout>
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>

                    <Button
                        v-if="loggedIn"
                        class="btn btn-secondary"
                        :text="_L('logOut')"
                        @tap="logout"
                    ></Button>
                    <Button
                        v-if="!loggedIn"
                        class="btn btn-secondary"
                        :text="_L('logIn')"
                        @tap="goToLogin"
                    ></Button>
                </FlexboxLayout>
            </ScrollView>

            <StationFooterTabs row="1" :station="station" active="station" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import StationFooterTabs from "./StationFooterTabs";
import Services from "../services/services";
import { hexStringToByteWiseString } from "../utilities";
import { Build } from "../config";

const stateManager = Services.StateManager();
const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

export default {
    data() {
        return {
            isEditingName: false,
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
            loggedIn: this.$portalInterface.isLoggedIn(),
            networks: [],
            newNetwork: { ssid: "", password: "" },
            addingNetwork: false,
            haveLora: false,
            invalidEui: false,
            invalidKey: false,
            lora: { deviceEui: "", appEui: "", appKey: "" },
            editingLora: false,
            versions: {
                firmware: "1.0",
                firmwareBuild: "1.0",
                device: "1.0",
                appBuildTime: Build.buildTime,
                appBuildNumber: Build.buildTime,
                appBuildTag: Build.buildTime,
                appCommit: hexStringToByteWiseString(Build.commit),
                appBranch: Build.branch
            }
        };
    },
    props: ["station"],
    components: {
        StationFooterTabs
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;
            let deviceStatus = JSON.parse(this.station.statusJson);
            if (deviceStatus && deviceStatus.status.identity) {
                let chunks = deviceStatus.status.identity.build.split("_");
                this.versions.firmwareBuild =
                    chunks[chunks.length - 2] + "_" + chunks[chunks.length - 1];
                this.versions.device = hexStringToByteWiseString(
                    deviceStatus.status.identity.deviceId
                );
                this.versions.firmware = hexStringToByteWiseString(
                    deviceStatus.status.identity.firmware
                );
            }
            if (deviceStatus && deviceStatus.networkSettings) {
                this.networks = deviceStatus.networkSettings.networks;
            }
            if (deviceStatus && deviceStatus.loraSettings) {
                let deviceEui = deviceStatus.loraSettings.deviceEui;
                if (deviceEui) {
                    this.lora.deviceEui = new Buffer.from(
                        Object.values(deviceEui)
                    ).toString("hex");
                    this.haveLora = true;
                }
            }
            this.deviceStatus = deviceStatus;
        },

        goBack(event) {
            // Change background color when pressed
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

        goToModuleConfig(event) {
            this.$navigateTo(routes.configureModule, {
                props: {
                    // remove the "m_id-" prefix
                    moduleId: event.object.dataId.split("m_id-")[1],
                    station: this.station,
                    origin: "settings"
                }
            });
        },

        startRename() {
            this.isEditingName = true;
        },

        checkName() {
            // reset these first
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            // then check
            this.noName = !this.station.name || this.station.name.length == 0;
            if (this.noName) {
                this.station.name = this.station.origName;
                return false;
            }
            let matches = this.station.name.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.station.name.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },

        saveStationName() {
            this.isEditingName = false;
            let valid = this.checkName();
            if (valid && this.station.origName != this.station.name) {
                stateManager
                    .renameStation(this.station, this.station.name)
                    .then(() => {
                        this.station.origName = this.station.name;
                    })
                    .catch(error => {
                        console.error("unhandled error", error);
                    });
                /*
                NOTE:  Left for the moment. I think we'll have to come back and do the fancy config tracking later.
                let configChange = {
                    stationId: this.station.id,
                    before: this.station.origName,
                    after: this.station.name,
                    affectedField: "name",
                    author: this.user.name
                }
                dbInterface.recordStationConfigChange(configChange);
                */
            }
        },

        cancelRename() {
            this.isEditingName = false;
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            this.station.name = this.station.origName;
        },

        stopRecording(event) {
            queryStation.stopDataRecording(this.station.url).then(result => {
                const priorValue = "recording";
                this.station.status = "idle";
                this.updateStationStatus(priorValue);
            });
        },

        updateStationStatus(priorValue) {
            // update db
            dbInterface.setStationDeployStatus(this.station);
            let configChange = {
                stationId: this.station.id,
                before: priorValue,
                after: this.station.status,
                affectedField: "status",
                author: this.userName
            };
            dbInterface.recordStationConfigChange(configChange);

            // update portal
            if (this.station.portalId && this.station.url != "no_url") {
                let params = {
                    name: this.station.name,
                    device_id: this.station.deviceId,
                    status_json: this.station
                };
                return this.$portalInterface
                    .updateStation(params, this.station.portalId)
                    .then(stationPortalId => {
                        // console.log("successfully updated", stationPortalId)
                        return Promise.resolve();
                    });
            } else {
                return Promise.resolve();
            }
        },

        showNetworkForm(event) {
            this.addingNetwork = true;
        },

        addNetwork(event) {
            this.addingNetwork = false;
            let network = {
                ssid: this.newNetwork.ssid,
                password: this.newNetwork.password
            };
            let index = this.networks.findIndex(n => {
                return n.ssid == network.ssid;
            });
            if (index > -1) {
                // replace if it's already present
                this.networks[index].password = network.password;
            } else {
                // otherwise add it
                this.networks.push(network);
            }

            queryStation
                .sendNetworkSettings(this.station.url, this.networks)
                .then(result => {
                    this.networks = result.networkSettings.networks;
                    // in order to match in the interim, must edit station.statusJson
                    this.deviceStatus.networkSettings = result.networkSettings;
                    let status = JSON.stringify(this.deviceStatus);
                    this.station.statusJson = status;
                });
        },

        removeNetwork(event) {
            let ssid = event.object.dataSsid;
            let index = this.networks.findIndex(n => {
                return n.ssid == ssid;
            });
            if (index > -1) {
                this.networks.splice(index, 1);
            }
            queryStation
                .sendNetworkSettings(this.station.url, this.networks)
                .then(result => {
                    this.networks = result.networkSettings.networks;
                    // in order to match in the interim, must edit station.statusJson
                    this.deviceStatus.networkSettings = result.networkSettings;
                    let status = JSON.stringify(this.deviceStatus);
                    this.station.statusJson = status;
                });
        },

        showLoraForm(event) {
            this.editingLora = true;
        },

        checkAppEui() {
            try {
                if (this.lora.appEui.length != 16) {
                    throw Error("Invalid length");
                }

                let appEui = Buffer.from(this.lora.appEui, "hex");
                return appEui;
            } catch (error) {
                this.invalidEui = true;
            }
        },

        checkAppKey() {
            try {
                if (this.lora.appKey.length != 32) {
                    throw Error("Invalid length");
                }

                let appKey = Buffer.from(this.lora.appKey, "hex");
                return appKey;
            } catch (error) {
                this.invalidKey = true;
            }
        },

        editLora(event) {
            this.invalidEui = false;
            this.invalidKey = false;
            let appEui = this.checkAppEui();
            let appKey = this.checkAppKey();

            if (appEui && appKey) {
                this.editingLora = false;
                this.invalidEui = false;
                this.invalidKey = false;

                let sendableLora = {
                    appEui: appEui,
                    appKey: appKey
                };

                queryStation
                    .sendLoraSettings(this.station.url, sendableLora)
                    .then(result => {
                        // this.appEui = new Buffer.from(Object.values(result.appEui)).toString("hex");
                        // this.appKey = new Buffer.from(Object.values(result.appKey)).toString("hex");
                        // in order to match in the interim, must edit station.statusJson
                        // NOTE: appEui and appKey currently aren't sent in statusJson, so they
                        // won't be preserved after exiting this view
                        // console.log("response from station after adding", result.loraSettings)
                    });
            }
        },

        logout() {
            this.$portalInterface.logout();
            this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {
                    resetUser: true
                }
            });
        },

        goToLogin() {
            this.$navigateTo(routes.login);
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.y-bordered-container {
    border-color: $fk-gray-lighter;
    border-top-width: 1;
    border-bottom-width: 1;
}

.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 2;
}

.section-border {
    margin: 10;
    border-bottom-color: $fk-gray-lightest;
    border-bottom-width: 2;
}

.input {
    width: 225;
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
    padding-top: 3;
    padding-left: 2;
    padding-right: 0;
    padding-bottom: 0;
    margin: 0;
    margin-bottom: 2;
}

.network-input {
    border-bottom-color: $fk-primary-black;
    border-bottom-width: 1;
    padding: 0;
    margin-left: 8;
    margin-bottom: 8;
}

.char-count {
    width: 25;
    margin-top: 15;
    margin-left: 5;
}

.station-name {
}

.validation-error {
    width: 100%;
    font-size: 13;
    color: $fk-tertiary-red;
}

.full-width {
    width: 100%;
}
</style>
