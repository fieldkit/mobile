<template>
    <Page class="page" @loaded="onPageLoaded">
        <PlatformHeader :title="_L('connectStation')" :canNavigateSettings="false" />
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <ConnectionStatusHeader :connected="currentStation.connected" />

                        <Label class="title m-t-60 m-b-10 text-center" :text="_L('changeStationName')" textWrap="true" />

                        <Label class="instruction" :text="_L('changeStationNameInstruction')" lineHeight="4" textWrap="true" />

                        <GridLayout rows="auto" columns="*,30" class="bottom-bordered m-x-20">
                            <TextField
                                col="0"
                                textWrap="true"
                                class="size-16 no-border-input"
                                :hint="_L('stationNameHint')"
                                v-model="form.name"
                                keyboardType="_L('stationNameHint')"
                                autocorrect="false"
                                autocapitalizationType="none"
                                @blur="validate"
                            />
                            <Image col="1" width="17" @tap="clearName" src="~/images/Icon_Close.png" />
                        </GridLayout>

                        <Label
                            class="validation-error"
                            id="no-name"
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="form.v.required ? 'visible' : 'collapsed'"
                        />
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="form.v.long ? 'visible' : 'collapsed'"
                        />
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            :text="_L('nameNotPrintable')"
                            textWrap="true"
                            :visibility="form.v.characters ? 'visible' : 'collapsed'"
                        />
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout row="1" verticalAlignment="bottom" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded m-y-10"
                    :text="_L('saveNewName')"
                    @tap="rename"
                    :isEnabled="currentStation.connected && !busy"
                />
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import SharedComponents from "@/components/shared";
import routes from "../../routes";
import { validateStationName } from "../../utilities";
import { RenameStationAction, LegacyStation } from "@/store";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import LabeledTextField from "~/components/LabeledTextField.vue";

export default Vue.extend({
    components: {
        ...SharedComponents,
        ConnectionStatusHeader,
        LabeledTextField,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data(): {
        error: boolean;
        busy: boolean;
        form: {
            name: string;
            v: {
                required: boolean;
                long: boolean;
                characters: boolean;
                any: boolean;
            };
        };
    } {
        return {
            error: false,
            busy: false,
            form: {
                name: "",
                v: {
                    required: false,
                    long: false,
                    characters: false,
                    any: false,
                },
            },
        };
    },
    computed: {
        currentStation(): LegacyStation {
            return this.$s.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(): void {
            this.form.name = this.currentStation.name;
        },
        async rename(): Promise<void> {
            if (!this.validate()) {
                return;
            }

            this.busy = true;

            if (this.form.name != this.currentStation.name) {
                console.log("rename", this.form.name, this.currentStation.name);
                return this.$s
                    .dispatch(new RenameStationAction(this.currentStation.deviceId, this.form.name))
                    .then(async () => {
                        await this.$navigateTo(routes.onboarding.reconnecting, {
                            props: {
                                stationId: this.currentStation.id,
                            },
                        });
                    })
                    .catch((error) => {
                        this.busy = false;
                        this.error = true;
                    });
            }
            await this.$navigateTo(routes.onboarding.deploymentLocation, {
                props: {
                    stationId: this.currentStation.id,
                },
            });
        },
        validate(): boolean {
            this.form.v = {
                required: false,
                long: false,
                characters: false,
                any: false,
            };

            this.form.name = this.form.name.trim();
            this.form.v = _.extend(this.form.v, validateStationName(this.form.name));
            return !this.form.v.any;
        },
        clearName(): void {
            this.form.name = "";
        },
        async skip(): Promise<void> {
            await this.$navigateTo(routes.onboarding.deploymentLocation, {
                props: {
                    stationId: this.currentStation.id,
                },
            });
        },
        async onBack(): Promise<void> {
            console.log("onBack");
            await this.$navigateTo(routes.onboarding.nearby, {});
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
}
.validation-error {
    width: 100%;
    font-size: 13;
    margin-top: 5;
    color: $fk-tertiary-red;
    text-align: center;
}

.skip {
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 16;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 18;
    margin-top: 5;
    margin-bottom: 100;
    margin-right: 30;
    margin-left: 30;
}
.m-t-60 {
    margin-top: 60;
}
</style>
