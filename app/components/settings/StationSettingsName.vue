<template>
    <Page @loaded="onPageLoaded">
        <PlatformHeader :title="_L('stationName')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <StackLayout class="p-t-10">
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
                    />
                    <Image col="1" width="17" @tap="clearName" src="~/images/Icon_Close.png" />
                </GridLayout>
                <Label
                    class="validation-error"
                    id="no-name"
                    :text="_L('nameRequired')"
                    textWrap="true"
                    :visibility="noName ? 'visible' : 'collapsed'"
                />
                <Label
                    class="validation-error"
                    id="name-too-long"
                    :text="_L('nameOver40')"
                    textWrap="true"
                    :visibility="nameTooLong ? 'visible' : 'collapsed'"
                />
                <Label
                    class="validation-error"
                    id="name-not-printable"
                    :text="_L('nameNotPrintable')"
                    textWrap="true"
                    :visibility="nameNotPrintable ? 'visible' : 'collapsed'"
                />

                <StackLayout class="m-30"></StackLayout>

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
