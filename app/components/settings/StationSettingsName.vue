<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="80,*,70">
            <StackLayout row="0">
                <ScreenHeader :title="_L('stationName')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
                <StackLayout class="p-b-10"></StackLayout>
            </StackLayout>
            <ScrollView row="1">
                <GridLayout rows="*" columns="*" verticalAlignment="middle" class="p-t-10">
                    <StackLayout>
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

                        <Button
                            class="btn btn-primary btn-padded"
                            :text="_L('saveName')"
                            :isEnabled="station.connected"
                            @tap="saveStationName"
                        />
                        <ConnectionNote :station="station" :stationId="stationId" />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <ScreenFooter row="2" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import Vue from "../../wrappers/vue";
import * as ActionTypes from "../../store/actions";

import ScreenHeader from "../ScreenHeader";
import ScreenFooter from "../ScreenFooter";
import General from "./StationSettingsGeneral";
import ConnectionNote from "./StationSettingsConnectionNote";
import * as animations from "../animations";

export default Vue.extend({
    data() {
        return {
            stationName: "",
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
        };
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    components: {
        ScreenHeader,
        ScreenFooter,
        General,
        ConnectionNote,
    },
    computed: {
        station() {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        getStation() {
            return this.$store.getters.legacyStations[this.stationId];
        },
        onPageLoaded(args) {
            this.page = args.object;
            this.stationName = this.getStation().name;
            this.origName = this.stationName;
        },
        goBack(ev) {
            return Promise.all([
                animations.pressed(ev),
                this.$navigateTo(General, {
                    props: {
                        stationId: this.stationId,
                        station: this.getStation(),
                    },
                    transition: {
                        name: "slideRight",
                        duration: 250,
                        curve: "linear",
                    },
                }),
            ]);
        },
        checkName() {
            this.stationName = this.stationName.trim();
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            this.noName = !this.stationName || this.stationName.length == 0;
            if (this.noName) {
                this.stationName = this.origName;
                return false;
            }
            const matches = this.stationName.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.stationName.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },
        saveStationName() {
            const valid = this.checkName();
            if (valid && this.origName != this.stationName) {
                return this.$store
                    .dispatch(ActionTypes.RENAME_STATION, { deviceId: this.getStation().deviceId, name: this.stationName })
                    .then(() => {
                        return this.goBack();
                    })
                    .catch((error) => {
                        this.error = true;
                    });
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
        },
    },
});
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
