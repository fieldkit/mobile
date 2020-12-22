<template>
    <GridLayout rows="*,*" columns="45,*,*" class="bordered-container m-20 p-15" :class="selected ? 'selected' : ''" @tap="emitTap">
        <Image
            row="0"
            col="0"
            width="45"
            :src="
                remote
                    ? '~/images/station_wifi_icon' + (selected ? '_selected.png' : '.png')
                    : '~/images/wifi_network_icon' + (selected ? '_selected.png' : '.png')
            "
        ></Image>
        <StackLayout row="0" col="1" class="m-l-15 m-t-5">
            <Label class="bold size-16 m-b-5" :text="remote ? _L('stationWifi') : _L('yourWifi')"></Label>
            <Label class="size-14" :text="remote ? _L('stationWifiInfo') : _L('yourWifiInfo')"></Label>
        </StackLayout>
        <Label
            v-if="recommended"
            row="0"
            col="2"
            class="size-12 text-right recommended"
            verticalAlignment="top"
            :text="_L('recommended')"
        ></Label>
        <Label
            row="1"
            colSpan="3"
            class="size-14 m-t-10"
            textWrap="true"
            lineHeight="4"
            :text="remote ? _L('stationWifiDescription') : _L('yourWifiDescription')"
        ></Label>
    </GridLayout>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";

export default Vue.extend({
    name: "NetworkTypeItem",
    components: {},
    props: {
        selected: {
            type: Boolean,
            required: true,
        },
        remote: {
            type: Boolean,
            required: true,
        },
        recommended: {
            type: Boolean,
            required: true,
        },
    },
    data() {
        return {
            REMOTE_SELECTED: 1,
            CONNECTED_SELECTED: 2,
        };
    },
    methods: {
        emitTap() {
            this.$emit("tapped");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;

    &.selected {
        border-color: $fk-logo-blue;
        border-width: 3;
    }
}

.recommended {
    color: $fk-primary-blue;
    font-weight: bold;
}
</style>
