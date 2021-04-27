<template>
    <GridLayout rows="auto,auto" columns="*" class="top-line-bkgd m-t-10">
        <StackLayout row="0" horizontalAlignment="left" :width="progress + '%'" class="top-line"></StackLayout>
        <StackLayout row="1" class="text-center connection-warning" v-if="!connected">
            <Label :text="_L('stationDisconnectedTapHere')" class="size-15" textWrap="true" @tap="reconnection" />
        </StackLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "ProgressBarAndStatus",
    props: {
        connected: {
            type: Boolean,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
        },
    },
    data(): {} {
        return {};
    },
    methods: {
        reconnection(): void {
            console.log("reconnection", this.progress);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.top-line-bkgd {
    background-color: $fk-gray-lighter;
    margin-bottom: 20;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
.connection-warning {
    padding-top: 8;
    padding-bottom: 5;
    color: $fk-primary-black;
    font-size: 16;
    background-color: #fddb7a;
    height: 37;
}
</style>
