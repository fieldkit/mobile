<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="*" columns="*">
                    <StackLayout row="0" verticalAlignment="middle">
                        <ConnectionStatusHeader :connected="currentStation.connected" />

                        <Label class="title m-t-20 m-b-10 text-center" :text="_L('chooseWifiSettings')" textWrap="true"></Label>

                        <Label class="instruction" :text="_L('chooseWifiInstruction')" lineHeight="4" textWrap="true"></Label>

                        <GridLayout rows="auto,auto" columns="30,*" class="option-container" @tap="selectOption(0)">
                            <CheckBox
                                row="0"
                                col="0"
                                :checked="form.options[0].selected"
                                :isEnabled="!form.options[0].selected"
                                fillColor="#2C3E50"
                                onCheckColor="#2C3E50"
                                onTintColor="#2C3E50"
                                fontSize="18"
                                boxType="circle"
                                class="checkbox"
                                @checkedChange="$event.value !== form.options[0].selected && selectOption(0)"
                            />
                            <Label row="0" col="1" class="m-t-5 m-l-5" :text="_L('stationWifi')"></Label>
                            <Label
                                row="1"
                                colSpan="2"
                                class="radio-info size-15"
                                lineHeight="4"
                                :text="_L('stationWifiInfo')"
                                textWrap="true"
                            ></Label>
                        </GridLayout>

                        <GridLayout rows="auto,auto" columns="30,*" class="option-container" @tap="selectOption(1)">
                            <CheckBox
                                row="0"
                                col="0"
                                :checked="form.options[1].selected"
                                :isEnabled="!form.options[1].selected"
                                fillColor="#2C3E50"
                                onCheckColor="#2C3E50"
                                onTintColor="#2C3E50"
                                fontSize="18"
                                boxType="circle"
                                class="checkbox"
                                @checkedChange="$event.value !== form.options[1].selected && selectOption(1)"
                            />
                            <Label row="0" col="1" class="m-t-5 m-l-5" :text="_L('yourWifi')"></Label>
                            <Label
                                row="1"
                                colSpan="2"
                                class="radio-info size-15"
                                lineHeight="4"
                                :text="_L('yourWifiInfo')"
                                textWrap="true"
                            ></Label>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout :row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" @tap="forward" :isEnabled="currentStation.connected" />
                <Label :text="_L('skipStep')" class="skip" @tap="skip" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { _T } from "@/utilities";
import ConnectionStatusHeader from "../ConnectionStatusHeader.vue";

export default Vue.extend({
    name: "Network",
    components: {
        ConnectionStatusHeader,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            form: {
                network: 0,
                options: [{ selected: true }, { selected: false }],
            },
        };
    },
    computed: {
        currentStation(this: any) {
            const station = this.$s.getters.legacyStations[this.stationId];
            if (!station) {
                throw new Error("no station");
            }
            return station;
        },
    },
    methods: {
        onPageLoaded(args) {},
        forward(this: any) {
            if (this.form.network == 0) {
                console.log("forward", "rename", this.form.network);
                return this.$navigateTo(routes.onboarding.rename, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
            if (this.form.network == 1) {
                console.log("forward", "network", this.form.network);
                return this.$navigateTo(routes.onboarding.addWifi, {
                    props: {
                        stationId: this.stationId,
                    },
                });
            }
            console.log("forward", "error", this.form.network);
        },
        selectOption(this: any, index: number) {
            this.form.network = index;
            this.form.options[0].selected = false;
            this.form.options[1].selected = false;
            this.form.options[index].selected = true;
        },
        skip(this: any) {
            console.log("forward", this.form);
            return this.$navigateTo(routes.stations, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
.option-container {
    margin-top: 30;
    margin-left: 30;
    margin-right: 30;
}
.radio-info {
    color: $fk-gray-hint;
    margin-top: 10;
    margin-bottom: 20;
    margin-left: 35;
}
.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
}
.small {
    width: 50;
    margin: 20;
}

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.gray-text {
    color: $fk-gray-hint;
}
.red-text {
    color: $fk-primary-red;
}
</style>
