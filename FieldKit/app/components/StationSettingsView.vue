<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                <GridLayout rows="auto" columns="15*,70*,15*" class="bottom-border p-b-10">
                    <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <GridLayout col="1" rows="auto,auto" columns="*">
                        <Label row="0"
                            class="size-20 m-y-0 text-center"
                            text="Station Settings"
                            textWrap="true"></Label>
                        <Label row="1"
                            class="text-center size-14"
                            :text="station.name"
                            textWrap="true"></Label>
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
                        src="~/images/Icon_Close.png"></Image>
                    <Label
                        class="station-name text-center size-20"
                        :text="station.name"
                        v-show="!isEditingName"
                        textWrap="true"></Label>
                    <TextField
                        class="input size-20"
                        :isEnabled="true"
                        keyboardType="name"
                        autocorrect="false"
                        autocapitalizationType="none"
                        v-model="station.name"
                        v-show="isEditingName"
                        returnKeyType="next"
                        @blur="checkName"></TextField>
                    <Label
                        class="size-10 char-count"
                        :text="station.name.length"
                        v-show="isEditingName"></Label>
                    <Image
                        class="m-l-10"
                        width="18"
                        v-show="!isEditingName"
                        @tap="startRename"
                        src="~/images/Icon_Edit.png"></Image>
                    <Image
                        class="m-10"
                        width="17"
                        v-show="isEditingName"
                        @tap="saveStationName"
                        src="~/images/Icon_Save.png"></Image>
                    <!-- validation errors -->
                    <Label
                        class="validation-error"
                        id="no-name"
                        :text="_L('nameRequired')"
                        textWrap="true"
                        :visibility="noName ? 'visible' : 'collapsed'"></Label>
                    <Label
                        class="validation-error"
                        id="name-too-long"
                        :text="_L('nameOver40')"
                        textWrap="true"
                        :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                    <Label
                        class="validation-error"
                        id="name-not-printable"
                        :text="_L('nameNotPrintable')"
                        textWrap="true"
                        :visibility="nameNotPrintable ? 'visible' : 'collapsed'"></Label>
                    <!-- end edit name form -->
                    <Label text="Firmware v 1.0" class="size-16 full-width" />
                </WrapLayout>
                <StackLayout class="section-border"></StackLayout>

                <!-- stop deployment button -->
                <StackLayout class="m-x-10" v-if="station.status == 'recording'">
                    <Label text="End Deployment" class="size-20 m-y-5 full-width" />
                    <Label text="To undeploy and stop recording data, you must be connected to your station."
                        class="size-16 m-y-5"
                        textWrap="true" />
                    <Button class="btn btn-primary full-width"
                        text="Stop Recording"
                        @tap="stopRecording"></Button>
                </StackLayout>
                <StackLayout class="section-border" v-if="station.status == 'recording'"></StackLayout>

                <!-- add/remove networks -->
                <StackLayout class="m-x-10">
                    <Label text="WiFi Networks" class="size-20"></Label>
                    <GridLayout rows="auto" columns="75*,25*" v-for="n in networks" :key="n.ssid">
                        <Label :text="n.ssid" col="0" class="m-l-15 m-y-10"></Label>
                        <Image
                            col="1"
                            src="~/images/Icon_Close.png"
                            width="17"
                            :dataSsid="n.ssid"
                            @tap="removeNetwork"></Image>
                    </GridLayout>

                    <GridLayout v-if="!addingNetwork" rows="auto" columns="10*,90*" @tap="showNetworkForm">
                        <Image col="0" src="~/images/add.png" width="30"></Image>
                        <Label col="1" text="Add a network to station" class="size-16" ></Label>
                    </GridLayout>

                    <StackLayout v-if="addingNetwork">
                        <GridLayout rows="auto,auto,auto" columns="35*,65*">
                            <Label row="0" col="0" text="Network name: " class="text-right"></Label>
                            <TextField
                                row="0"
                                col="1"
                                class="network-input"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newNetwork.ssid"
                                returnKeyType="next"></TextField>
                            <Label row="1" col="0" text="Password: " class="text-right"></Label>
                            <TextField
                                row="1"
                                col="1"
                                class="network-input"
                                secure="true"
                                ref="password"
                                v-model="newNetwork.password"
                                returnKeyType="done"></TextField>
                            <Button
                                row="2"
                                colSpan="2"
                                class="btn btn-secondary"
                                text="Add"
                                @tap="addNetwork"></Button>
                        </GridLayout>
                    </StackLayout>
                </StackLayout>
                <StackLayout class="section-border"></StackLayout>

                <!-- add/remove LoRa -->
                <StackLayout class="m-x-10">
                    <Label text="LoRa (Long Range) Network to station" class="size-20"></Label>
                    <GridLayout rows="auto" columns="75*,25*" v-for="n in loraNetworks" :key="n.deviceEui">
                        <Label :text="n.deviceEui" col="0" class="m-l-15 m-y-10"></Label>
                        <Image
                            col="1"
                            src="~/images/Icon_Close.png"
                            width="17"
                            :dataEui="n.deviceEui"
                            @tap="removeLora"></Image>
                    </GridLayout>

                    <GridLayout v-if="!addingLora" rows="auto" columns="10*,90*" @tap="showLoraForm">
                        <Image col="0" src="~/images/add.png" width="30"></Image>
                        <Label col="1" text="Add a LoRa network" class="size-16" ></Label>
                    </GridLayout>

                    <StackLayout v-if="addingLora">
                        <GridLayout rows="auto,auto,auto,auto" columns="35*,65*">
                            <Label row="0" col="0" text="Device EUI: " class="text-right"></Label>
                            <TextField
                                row="0"
                                col="1"
                                class="network-input"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newLora.deviceEui"
                                returnKeyType="next"></TextField>
                            <Label row="1" col="0" text="App EUI: " class="text-right"></Label>
                            <TextField
                                row="1"
                                col="1"
                                class="network-input"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newLora.appEui"
                                returnKeyType="next"></TextField>
                            <Label row="2" col="0" text="App Key: " class="text-right"></Label>
                            <TextField
                                row="2"
                                col="1"
                                class="network-input"
                                autocorrect="false"
                                autocapitalizationType="none"
                                v-model="newLora.appKey"
                                returnKeyType="done"></TextField>
                            <Button
                                row="3"
                                colSpan="2"
                                class="btn btn-secondary"
                                text="Add"
                                @tap="addLora"></Button>
                        </GridLayout>
                    </StackLayout>
                </StackLayout>
                <StackLayout class="section-border"></StackLayout>

                <!-- links to module settings -->
                <StackLayout class="full-width">
                    <GridLayout rows="auto" columns="*" v-for="m in station.moduleObjects" :key="m.id">
                        <StackLayout class="y-bordered-container p-10 m-x-10 m-y-1">
                            <!-- top row of module list -->
                            <GridLayout rows="auto" columns="15*,70*,15*">
                                <!-- module icon -->
                                <Image row="0" col="0"
                                    width="40"
                                    horizontalAlignment="left"
                                    :src="(m.name.indexOf('Water') > -1 ? '~/images/Icon_Water_Module.png' :
                                        m.name.indexOf('Weather') > -1 ? '~/images/Icon_Weather_Module.png' :
                                        '~/images/Icon_Generic_Module.png')"></Image>
                                <!-- module name -->
                                <Label row="0" col="1"
                                    :text="m.name"
                                    verticalAlignment="center"
                                    class="module-name"
                                    textWrap="true" />
                                <!-- links to config -->
                                <Image row="0" col="2"
                                    width="30"
                                    horizontalAlignment="right"
                                    src="~/images/pointing_right.png"
                                    :dataId="'m_id-' + m.id"
                                    @tap="goToModuleConfig"></Image>
                            </GridLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>

                <Button v-if="loggedIn" class="btn btn-secondary" :text="_L('logOut')" @tap="logout"></Button>

                <!-- footer -->
                <StationFooterTabs :station="station" active="station" />

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import routes from "../routes";
import StationFooterTabs from './StationFooterTabs';
import Services from '../services/services';

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
            newNetwork: {ssid: "", password: ""},
            addingNetwork: false,
            loraNetworks: [],
            newLora: {deviceEui: "", appEui: "", appKey: ""},
            addingLora: false
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
            let deviceStatus = JSON.parse(this.station.status_json);

            if(deviceStatus && deviceStatus.networkSettings) {
                this.networks = deviceStatus.networkSettings.networks;
            }
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
                stateManager.renameStation(this.station, this.station.name).then(() => {
                    this.station.origName = this.station.name;
                }).catch((error) => {
                    console.error('unhandled error', error);
                });
                /*
                NOTE:  Left for the moment. I think we'll have to come back and do the fancy config tracking later.
                let configChange = {
                    station_id: this.station.id,
                    before: this.station.origName,
                    after: this.station.name,
                    affected_field: "name",
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
                station_id: this.station.id,
                before: priorValue,
                after: this.station.status,
                affected_field: "status",
                author: this.userName
            };
            dbInterface.recordStationConfigChange(configChange);

            // update portal
            if (this.station.portal_id && this.station.url != "no_url") {
                let params = {
                    name: this.station.name,
                    device_id: this.station.device_id,
                    status_json: this.station
                };
                return this.$portalInterface
                    .updateStation(params, this.station.portal_id)
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
            let network = {ssid: this.newNetwork.ssid, password: this.newNetwork.password};
            let index = this.networks.findIndex(n => {return n.ssid == network.ssid;});
            if(index > -1) {
                // replace if it's already present
                this.networks[index].password = network.password;
            } else  {
                // otherwise add it
                this.networks.push(network);
            }
            queryStation.sendNetworkSettings(this.station.url, this.networks).then(result => {
                console.log("response from station after adding:", result.networkSettings)
            });
        },

        removeNetwork(event) {
            let ssid = event.object.dataSsid;
            let index = this.networks.findIndex(n => {return n.ssid == ssid;});
            if(index > -1) {
                this.networks.splice(index, 1);
            }
            queryStation.sendNetworkSettings(this.station.url, this.networks).then(result => {
                console.log("response from station after removing:", result.networkSettings)
            });
        },

        showLoraForm(event) {
            this.addingLora = true;
        },

        addLora(event) {
            this.addingLora = false;
            let lora = {deviceEui: this.newLora.deviceEui, appEui: this.newLora.appEui, appKey: this.newLora.appKey};
            let index = this.loraNetworks.findIndex(n => {return n.deviceEui == network.deviceEui;});
            if(index > -1) {
                // replace if it's already present
                this.loraNetworks[index].appEui = lora.appEui;
                this.loraNetworks[index].appKey = lora.appKey;
            } else  {
                // otherwise add it
                this.loraNetworks.push(lora);
            }
            queryStation.sendLoraSettings(this.station.url, this.loraNetworks).then(result => {
                console.log("response from station after adding:", result.networkSettings)
            });
        },

        removeLora(event) {
            let deviceEui = event.object.dataEui;
            let index = this.loraNetworks.findIndex(n => {return n.deviceEui == deviceEui;});
            if(index > -1) {
                this.loraNetworks.splice(index, 1);
            }
            queryStation.sendLoraSettings(this.station.url, this.loraNetworks).then(result => {
                console.log("response from station after removing:", result.networkSettings)
            });
        },

        logout() {
            this.$portalInterface.logout();
            this.$navigateTo(routes.login, {
                clearHistory: true,
                props: {
                    resetUser: true
                }
            });
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
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
    margin-left: 8;
    margin-top: 8;
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
