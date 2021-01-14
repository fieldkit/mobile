<template>
    <Page>
        <PlatformHeader :title="_L('general')" :subtitle="station.name" :canNavigateSettings="false" />
        <GridLayout rows="auto,*">
            <ConnectionStatusHeader row="0" :connected="station.connected" />
            <ScrollView row="1">
                <StackLayout class="p-t-10">
                    <StackLayout :class="station.connected ? 'm-t-5' : ''">
                        <Label
                            v-for="(option, i) in menuOptions"
                            :key="option"
                            :class="'menu-text size-18 ' + (i == menuOptions.length - 1 ? 'bottom-border' : '')"
                            :text="option"
                            textWrap="true"
                            @tap="selectFromMenu"
                        ></Label>
                    </StackLayout>
                </StackLayout>
            </ScrollView>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import { AvailableStation } from "@/store";
import SharedComponents from "@/components/shared";
import StationName from "./StationSettingsName.vue";
import CaptureSchedule from "./StationSettingsCaptureSchedule.vue";
import * as animations from "../animations";
import ConnectionStatusHeader from "~/components/ConnectionStatusHeader.vue";

export default Vue.extend({
    data() {
        return {
            menuOptions: [_L("stationName"), _L("dataCaptureSchedule")],
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
        StationName,
        CaptureSchedule,
        ConnectionStatusHeader,
    },
    computed: {
        station(): AvailableStation {
            return this.$s.getters.availableStationsById[this.stationId];
        },
    },
    methods: {
        selectFromMenu(ev: Event): Promise<void> {
            void animations.pressed(ev);
            switch ((ev as any).object.text) {
                case _L("stationName"):
                    return this.goToName();
                case _L("dataCaptureSchedule"):
                    return this.goToSchedule();
            }
            return Promise.resolve();
        },
        async goToName(): Promise<void> {
            await this.$navigateTo(StationName, {
                props: {
                    stationId: this.stationId,
                },
            });
        },
        async goToSchedule(): Promise<void> {
            await this.$navigateTo(CaptureSchedule, {
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

.menu-text {
    padding-left: 5;
    padding-top: 20;
    padding-bottom: 20;
    margin-left: 10;
    margin-right: 10;
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.bottom-border {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}
</style>
