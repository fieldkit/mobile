<template>
    <StackLayout backgroundColor="white">
        <GridLayout rows="*" columns="*" width="100%" height="100%" class="p-20 modal-container text-center">
            <GridLayout rows="*,auto">
                <ScrollView row="0">
                    <DockLayout stretchLastChild="true">
                        <StackLayout dock="top">
                            <StackLayout orientation="horizontal" class="m-t-20">
                                <Label width="50" text="Id" class="size-16 firmware-id bold"></Label>
                                <Label text="Version" textAlignment="left" lineHeight="4" class="size-16 bold"></Label>
                            </StackLayout>
                            <StackLayout
                                v-for="firmware in firmwares"
                                :key="firmware.id"
                                orientation="horizontal"
                                class="firmware"
                                :class="currentFirmware && firmware.id === currentFirmware.id ? 'selected' : ''"
                                @tap="onSelect(firmware)"
                            >
                                <Label width="50" :text="firmware.id" class="size-16 firmware-id"></Label>
                                <Label :text="firmware.version" textWrap="true" textAlignment="left" lineHeight="4" class="size-16"></Label>
                            </StackLayout>
                        </StackLayout>
                    </DockLayout>
                </ScrollView>
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
import Vue from "vue";
import { AvailableFirmware } from "~/store";
import { debug } from "@/lib/debugging";

export default Vue.extend({
    props: {
        firmwares: {
            required: true,
            type: Array,
        },
    },
    data(): {
        currentFirmware: AvailableFirmware | null;
    } {
        return {
            currentFirmware: null,
        };
    },
    methods: {
        async onUpdate(): Promise<void> {
            if (this.$modal) {
                debug.log("updating");
                await this.$modal.close({ firmware: this.currentFirmware, updating: true });
            }
        },
        onSelect(firmware: AvailableFirmware): void {
            debug.log("selecting");
            this.currentFirmware = firmware;
        },
        async onClose(): Promise<void> {
            if (this.$modal) {
                debug.log("closing", this.$modal);
                await this.$modal.close({ firmware: null, updating: false });
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.firmware {
    margin-top: 15;
    padding: 10;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.firmware-id {
    color: $fk-logo-blue;
}

.selected {
    border-color: $fk-logo-blue;
}
</style>
