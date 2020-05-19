<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0">
                <ScreenHeader title="Station Name" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <GridLayout rows="*" columns="*" verticalAlignment="middle" class="p-t-10">
                    <StackLayout>
                        <!-- edit station name -->
                        <GridLayout rows="auto" columns="*,30" class="bottom-bordered m-x-20">
                            <TextField
                                col="0"
                                textWrap="true"
                                class="size-18 no-border-input"
                                v-model="stationName"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                @blur="checkName"
                            ></TextField>
                            <Image col="1" width="17" @tap="clearName" src="~/images/Icon_Close.png"></Image>
                        </GridLayout>
                        <!-- station name validation errors -->
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
                            :visibility="nameNotPrintable ? 'visible' : 'collapsed'"
                        ></Label>

                        <StackLayout class="m-30"></StackLayout>

                        <Button class="btn btn-primary btn-padded" text="Save Name" @tap="saveStationName" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";
import Services from "../../services/services";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import General from "./StationSettingsGeneral";

export default {
    data() {
        return {
            stationName: "",
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
        };
    },
    props: ["station"],
    components: {
        ScreenHeader,
        ScreenFooter,
        General,
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;
            this.stationName = this.station.name;
            this.origName = this.station.name;
        },

        goBack(event) {
            if (event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";
                setTimeout(() => {
                    event.object.className = cn;
                }, 500);
            }

            this.$navigateTo(General, {
                props: {
                    station: this.station,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        checkName() {
            // reset these first
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            // then check
            this.noName = !this.stationName || this.stationName.length == 0;
            if (this.noName) {
                this.stationName = this.origName;
                return false;
            }
            let matches = this.stationName.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.stationName.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },

        saveStationName() {
            let valid = this.checkName();
            if (valid && this.origName != this.stationName) {
                this.station.name = this.stationName;
                Services.StateManager()
                    .renameStation(this.station, this.station.name)
                    .then(() => {
                        this.origName = this.stationName;
                        this.goBack();
                    })
                    .catch(error => {
                        console.error("unhandled error", error);
                    });
            } else {
                this.goBack();
            }
        },

        clearName() {
            this.editingName = true;
            this.stationName = "";
        },

        cancelRename() {
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            this.station.name = this.origName;
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables

// Custom styles
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
.bottom-bordered {
    border-bottom-width: 1px;
    text-align: center;
    // iOS-only padding in app.ios.scss
}
.no-border-input {
    border-bottom-width: 1;
    border-bottom-color: white;
}
.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
}
.validation-error {
    width: 100%;
    font-size: 13;
    margin-top: 5;
    color: $fk-tertiary-red;
    text-align: center;
}
.char-count {
    width: 25;
    margin-top: 15;
    margin-left: 5;
}
.validation-error {
    width: 100%;
    font-size: 13;
    color: $fk-tertiary-red;
}
</style>
