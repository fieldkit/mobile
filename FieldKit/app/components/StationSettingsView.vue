<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between" class="p-t-10">
                <GridLayout rows="auto,auto" columns="15*,70*,15*" class="bottom-border p-b-10">
                    <StackLayout row="0" col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <Label row="0" col="1"
                        class="size-20 m-y-0 text-center"
                        text="Station Settings"
                        textWrap="true"></Label>
                    <Label row="1" col="1"
                        class="text-center size-14"
                        :text="station.name"
                        textWrap="true"></Label>
                    <StackLayout row="0" col="2" class="placeholder"></StackLayout>
                </GridLayout>

                <!-- edit station name -->
                <WrapLayout orientation="horizontal" class="m-x-10">
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

                <!-- links to module settings -->
                <GridLayout rows="auto" columns="*" v-for="m in station.moduleObjects" :key="m.id">
                    <StackLayout class="bordered-container p-10 m-10">
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
                                horizontalAlignment="right"
                                src="~/images/pointing_right.png"
                                width="15"
                                :dataId="'m_id-' + m.id"
                                @tap="goToModuleConfig"></Image>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>

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
                this.station.status = null;
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

        goToModuleConfig(event) {
            this.$navigateTo(routes.configureModule, {
                props: {
                    // remove the "m_id-" prefix
                    moduleId: event.object.dataId.split("m_id-")[1],
                    station: this.station,
                    origin: "settings"
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



.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 2;
}

.section-border {
    margin-left: 10;
    margin-right: 10;
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
