<template>
    <Page>
        <PlatformHeader :title="_L('longRangeNetwork')" :subtitle="station.name" :canNavigateSettings="false" />
        <StationSettingsLayout :connected="station.connected">
            <FlexboxLayout class="lora-network-form-container">
                <StackLayout row="0" class="m-b-20">
                    <LabeledTextField
                        v-model="form.deviceEui"
                        :label="_L('lora.deviceEui')"
                        @blur="checkDeviceEui"
                        :alwaysShowLabel="true"
                    />
                    <Label
                        v-show="v.deviceEui.hex"
                        class="validation-error"
                        horizontalAlignment="left"
                        :text="_L('required')"
                        textWrap="true"
                    />
                </StackLayout>
                <StackLayout row="1" class="m-b-20">
                    <LabeledTextField v-model="form.joinEui" :label="_L('lora.joinEui')" @blur="checkJoinEui" :alwaysShowLabel="true" />
                    <Label
                        v-show="v.joinEui.hex"
                        class="validation-error"
                        horizontalAlignment="left"
                        :text="_L('required')"
                        textWrap="true"
                    />
                </StackLayout>
                <StackLayout row="2" class="m-b-20">
                    <LabeledTextField v-model="form.appKey" :label="_L('lora.appKey')" @blur="checkAppKey" :alwaysShowLabel="true" />
                    <Label
                        v-show="v.appKey.hex"
                        class="validation-error"
                        horizontalAlignment="left"
                        :text="_L('required')"
                        textWrap="true"
                    />
                </StackLayout>
                <StackLayout row="3" class="m-b-20">
                    <LabeledTextField
                        v-model="form.frequencyBand"
                        :label="_L('lora.frequencyBand')"
                        :isEnabled="false"
                        :alwaysShowLabel="true"
                    />
                </StackLayout>

                <StackLayout row="4" class="m-b-20">
                    <Button
                        class="btn btn-primary"
                        :text="_L('save')"
                        :isEnabled="true && !(v.appKey.hex || v.joinEui.hex || v.deviceEui.hex)"
                        @tap="save"
                    />
                </StackLayout>
            </FlexboxLayout>
        </StationSettingsLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { Buffer } from "buffer";
import { AvailableStation, LoraSettings, ConfigureLoraOtaaAction } from "@/store";

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
    props: {
        stationId: {
            required: true,
            type: Number,
        },
    },
    data(): {
        form: {
            deviceEui: string;
            appKey: string;
            joinEui: string;
            frequencyBand: string;
        };
        v: {
            deviceEui: {
                required: boolean;
                length: boolean;
                hex: boolean;
            };
            appKey: {
                required: boolean;
                length: boolean;
                hex: boolean;
            };
            joinEui: {
                required: boolean;
                length: boolean;
                hex: boolean;
            };
        };
        busy: boolean;
    } {
        return {
            busy: false,
            form: {
                frequencyBand: "915",
                deviceEui: "0000000000000000",
                appKey: "00000000000000000000000000000000",
                joinEui: "0000000000000000",
            },
            v: {
                deviceEui: {
                    required: false,
                    length: false,
                    hex: false,
                },
                appKey: {
                    required: false,
                    length: false,
                    hex: false,
                },
                joinEui: {
                    required: false,
                    length: false,
                    hex: false,
                },
            },
        };
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        checkDeviceEui() {
            try {
                this.v.deviceEui.hex = false;
                if (this.form.deviceEui.length != 16) {
                    throw Error("invalid length");
                }
                return Buffer.from(this.form.deviceEui, "hex");
            } catch (error) {
                console.log(`device-eui error:`, error);
                this.v.deviceEui.hex = true;
                return null;
            }
        },
        checkAppKey() {
            try {
                this.v.appKey.hex = false;
                if (this.form.appKey.length != 32) {
                    throw Error("invalid length");
                }
                return Buffer.from(this.form.appKey, "hex");
            } catch (error) {
                console.log(`app-key error:`, error);
                this.v.appKey.hex = true;
                return null;
            }
        },
        checkJoinEui() {
            try {
                this.v.joinEui.hex = false;
                if (this.form.joinEui.length != 16) {
                    throw Error("invalid length");
                }
                return Buffer.from(this.form.joinEui, "hex");
            } catch (error) {
                console.log(`join-eui error:`, error);
                this.v.joinEui.hex = true;
                return null;
            }
        },
        async save(): Promise<void> {
            console.log("save", this.v, this.form);
            const frequencyBand = Number(this.form.frequencyBand);
            const deviceEui = this.checkDeviceEui();
            const joinEui = this.checkJoinEui();
            const appKey = this.checkAppKey();
            if (!deviceEui || !joinEui || !appKey) {
                return;
            }
            const settings: LoraSettings = {
                frequencyBand: frequencyBand,
                deviceEui: deviceEui,
                joinEui: joinEui,
                appKey: appKey,
            };
            this.busy = true;
            try {
                await this.$s.dispatch(new ConfigureLoraOtaaAction(this.station.deviceId, settings));
            } finally {
                this.busy = false;
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.validation-error {
    width: 100%;
    font-size: 13;
    color: $fk-tertiary-red;
}

.lora-network-form-container {
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
    padding: 20;

    .validation-error {
        color: $fk-tertiary-red;
        padding-top: 5;
    }
}
</style>
