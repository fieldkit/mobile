<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="auto,*,140">
            <ConnectionStatusHeader row="0" :connected="currentStation.connected" />
            <ScrollView row="1">
                <GridLayout rows="*" columns="*" verticalAlignment="middle">
                    <StackLayout row="0" verticalAlignment="middle">
                        <Label class="title m-t-20 m-b-10 text-center" :text="_L('changeStationName')" textWrap="true" />

                        <Label class="instruction" :text="_L('changeStationNameInstruction')" lineHeight="4" textWrap="true" />

                        <GridLayout rows="auto" columns="*,30" class="bottom-bordered m-x-20">
                            <TextField
                                col="0"
                                textWrap="true"
                                class="size-18 no-border-input"
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
import routes from "../../routes";
import { _T, validateStationName } from "../../utilities";
import * as ActionTypes from "../../store/actions";

import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";
import LabeledTextField from "../LabeledTextField";

export default Vue.extend({
    components: {
        ConnectionStatusHeader,
        LabeledTextField,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data() {
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
        currentStation(this: any) {
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    methods: {
        onPageLoaded(this: any, rgs) {
            this.form.name = this.currentStation.name;
        },
        rename(this: any) {
            if (!this.validate()) {
                return;
            }

            this.busy = true;

            if (this.form.name != this.currentStation.name) {
                console.log("rename", this.form.name, this.currentStation.name);
                return this.$store
                    .dispatch(ActionTypes.RENAME_STATION, { deviceId: this.currentStation.deviceId, name: this.form.name })
                    .then(() => {
                        return this.$navigateTo(routes.onboarding.reconnecting, {
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
            return this.$navigateTo(routes.onboarding.recalibrate, {
                props: {
                    stationId: this.currentStation.id,
                },
            });
        },
        validate(this: any) {
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
        clearName(this: any) {
            this.form.name = "";
        },
        skip(this: any) {
            return this.$navigateTo(routes.stations, {});
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
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
</style>
