<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('stationName')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <StackLayout class="m-x-10 m-t-20">
                <LabeledTextField v-model="stationName" @blur="validate" :canClear="true" />

                <Label class="validation-error" id="no-name" :text="_L('nameRequired')" textWrap="true" v-if="noName" />
                <Label class="validation-error" id="name-too-long" :text="_L('nameOver40')" textWrap="true" v-if="nameTooLong" />
                <Label
                    class="validation-error"
                    id="name-not-printable"
                    :text="_L('nameNotPrintable')"
                    textWrap="true"
                    v-if="nameNotPrintable"
                />

                <StackLayout class="m-20"></StackLayout>

                <Button
                    class="btn btn-primary btn-padded"
                    :text="_L('saveName')"
                    :isEnabled="station.connected && !busy"
                    @tap="saveStationName"
                />
            </StackLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { RenameStationAction, AvailableStation } from "@/store";

export default Vue.extend({
    data(): {
        stationName: string;
        origName: string;
        noName: boolean;
        nameTooLong: boolean;
        nameNotPrintable: boolean;
        error: boolean;
        busy: boolean;
    } {
        return {
            stationName: "",
            origName: "",
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
            error: false,
            busy: false,
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
    },
    computed: {
        station(this: any): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        onPageLoaded(): void {
            this.stationName = this.station.name ?? "";
            this.origName = this.stationName;
        },
        checkName(): boolean {
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
        async saveStationName(): Promise<void> {
            const valid = this.checkName();
            if (valid && this.origName != this.stationName) {
                this.busy = true;
                await this.$s
                    .dispatch(new RenameStationAction(this.station.deviceId, this.stationName))
                    .then(() => {
                        return this.$navigateBack();
                    })
                    .finally(() => {
                        this.busy = false;
                    })
                    .catch((error) => {
                        this.error = true;
                    });
            }
        },
        clearName(): void {
            this.stationName = "";
        },
        cancelRename(): void {
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
.validation-error {
    width: 100%;
    font-size: 13;
    margin-top: 5;
    color: $fk-tertiary-red;
    text-align: left;
}
</style>
