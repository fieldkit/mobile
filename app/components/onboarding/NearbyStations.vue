<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" navigatingTo="onNavigatingTo">
        <GridLayout rows="*,140">
            <ScrollView row="0">
                <GridLayout rows="auto" columns="*" verticalAlignment="middle">
                    <StackLayout row="0" verticalAlignment="middle">
                        <GridLayout rows="*" columns="*">
                            <StackLayout row="0" verticalAlignment="middle">
                                <Label class="title m-t-20 m-b-10 text-center" :text="_L('selectYourStation')" textWrap="true"></Label>

                                <Label class="instruction" :text="_L('selectStationInstruction')" lineHeight="4" textWrap="true"></Label>

                                <StackLayout class="m-t-10"></StackLayout>
                                <GridLayout rows="auto" columns="30,*" class="option-container" v-for="station in nearbyStations" :key="station.id">
                                    <CheckBox
                                        col="0"
                                        :checked="station.selected"
                                        :isEnabled="!station.selected"
                                        fillColor="#2C3E50"
                                        onCheckColor="#2C3E50"
                                        onTintColor="#2C3E50"
                                        fontSize="18"
                                        boxType="circle"
                                        @checkedChange="$event.value !== station.selected && onCheckChange($event.value)"
                                    />
                                    <Label col="1" class="m-t-5 m-l-5" :text="station.name"></Label>
                                </GridLayout>
                            </StackLayout>
                        </GridLayout>
                    </StackLayout>
                </GridLayout>
            </ScrollView>

            <StackLayout row="1" verticalAlignment="bottom" class="m-x-10">
                <Button class="btn btn-primary btn-padded m-y-10" :text="_L('next')" :isEnabled="true" @tap="forward"></Button>
                <Label :text="_L('noStationTryAgain')" class="skip" @tap="tryAgain" textWrap="true" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import routes from "../../routes";

export default {
    props: {},
    data() {
        return {
            selectedStationId: null,
        };
    },
    computed: {
        nearbyStations() {
            return Object.values(this.$store.getters.legacyStations)
                .filter(station => station.connected)
                .map(station => {
                    console.log("station");
                    return {
                        id: station.id,
                        selected: station.id == this.selectedStationId,
                        name: station.name,
                    };
                });
        },
    },
    methods: {
        onPageLoaded(args) {
            const connected = Object.values(this.$store.getters.legacyStations).filter(ls => ls.connected);
            if (connected.length == 0) {
                throw new Error("invalid transition, no nearby stations");
            }

            this.selectedStationId = connected[0].id;
        },
        onNavigatingTo() {},
        tryAgain() {
            return this.$navigateTo(routes.onboarding.searching, {});
        },
        forward() {
            return this.$navigateTo(routes.onboarding.network, {
                props: {
                    stationId: this.selectedStationId,
                },
            });
        },
        onCheckChange(id) {
            console.log("choose", id);
            this.selectedStationId = id;
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

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
