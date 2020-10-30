<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('stationName')" :subtitle="station.name" :onBack="goBack" :canNavigateSettings="false" />
        <GridLayout rows="*,70">
            <ScrollView row="0">
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

            <ScreenFooter row="1" :station="station" active="stations" />
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { ActionTypes } from "../../store/actions";

import SharedComponents from "@/components/shared";
import General from "./StationSettingsGeneral.vue";
import ConnectionNote from "./StationSettingsConnectionNote.vue";
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
        ...SharedComponents,
        General,
        ConnectionNote,
    },
    computed: {
        station(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        getStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
        onPageLoaded(this: any, args) {
            this.page = args.object;
            this.stationName = this.getStation().name;
            this.origName = this.stationName;
        },
        goBack(this: any, ev) {
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
        checkName(this: any) {
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
        saveStationName(this: any) {
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
        clearName(this: any) {
            this.editingName = true;
            this.stationName = "";
        },
        cancelRename(this: any) {
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
