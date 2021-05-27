<template>
    <StackLayout class="modal-bkgd">
        <GridLayout rows="*" columns="*" width="100%" height="100%" class="p-20 modal-container text-center">
            <GridLayout rows="*,auto">
                <DockLayout row="0" stretchLastChild="true">
                    <StackLayout dock="top">
                        <Label :text="_L('updateFirmwareModalTitle')" class="size-18 m-t-100 m-b-30"></Label>
                        <StackLayout orientation="horizontal">
                            <StackLayout width="50" height="50" class="full-circle m-r-30">
                                <Label text="1" class="m-t-15 size-24"></Label>
                            </StackLayout>
                            <Label
                                :text="_L('updateFirmwareModalText1')"
                                textWrap="true"
                                textAlignment="left"
                                lineHeight="4"
                                class="size-16"
                            ></Label>
                        </StackLayout>
                        <StackLayout orientation="horizontal" class="m-t-30">
                            <StackLayout width="50" height="50" class="full-circle m-r-30">
                                <Label text="2" class="m-t-15 size-24"></Label>
                            </StackLayout>
                            <Label
                                :text="_L('updateFirmwareModalText2')"
                                textWrap="true"
                                textAlignment="left"
                                lineHeight="4"
                                class="size-16"
                            ></Label>
                        </StackLayout>
                        <StackLayout orientation="horizontal" class="m-t-30">
                            <StackLayout width="50" height="50" class="full-circle m-r-30">
                                <Label text="3" class="m-t-15 size-24"></Label>
                            </StackLayout>
                            <Label
                                :text="_L('updateFirmwareModalText3')"
                                textWrap="true"
                                textAlignment="left"
                                lineHeight="4"
                                class="size-16"
                            ></Label>
                        </StackLayout>
                    </StackLayout>
                </DockLayout>
                <StackLayout row="1">
                    <Button
                        :text="_L('updateFirmwareModalContinueButton')"
                        class="btn btn-primary btn-no-margin btn-color-white"
                        @tap="onUpdate"
                    />
                    <Button :text="_L('updateFirmwareModalCancelButton')" class="btn btn-update btn-no-margin" @tap="onClose" />
                </StackLayout>
            </GridLayout>
        </GridLayout>
    </StackLayout>
</template>
<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import { AvailableStation, UpgradeStatus, UpgradeInfo } from "@/store";

export default Vue.extend({
    props: {
        stationId: {
            required: true,
            type: Number,
        },
        downloadOnly: {
            required: true,
            type: Boolean,
        },
    },
    computed: {
        done(): boolean {
            return this.status.done || false;
        },
        error(): boolean {
            return this.status.error || false;
        },
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
        upgrade(): UpgradeInfo {
            return this.$s.state.firmware.status[this.stationId] || {};
        },
        status(): UpgradeStatus {
            return this.upgrade?.status || {};
        },
    },
    methods: {
        onUpdate(): void {
            console.log("updating");
            this.$modal.close({ updating: true });
        },
        onClose(): void {
            console.log("closing", this.$modal);
            this.$modal.close({ updating: false });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.modal-bkgd {
    background-color: gray;
}
.modal-container {
    background-color: white;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}

.full-circle {
    border-color: $fk-logo-blue;
    background-color: $fk-logo-blue;
    border-radius: 50%;
    color: white;
}

.m-t-100 {
    margin-top: 100;
}
</style>
