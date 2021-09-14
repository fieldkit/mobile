<template>
    <StackLayout height="100%" backgroundColor="white" verticalAlignment="middle">
        <GridLayout rows="auto,auto,*,auto" columns="*">
            <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
            <Label row="1" :text="text" class="instruction-heading"></Label>
            <CalibrationSummary row="2" :sensor="sensor" v-if="sensor" />
            <StackLayout row="3" class="buttons-container" v-if="sensor">
                <Button class="btn btn-primary btn-padded" :text="_L('done')" @tap="done" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { CalibratingSensor } from "./model";
import CalibrationSummary from "./CalibrationSummary.vue";
// import { debug } from "@/lib";

export default Vue.extend({
    name: "Success",
    components: {
        CalibrationSummary,
    },
    props: {
        sensor: {
            type: CalibratingSensor,
            default: null,
        },
        text: {
            type: String,
            default: "",
        },
    },
    methods: {
        done() {
            this.$emit("done");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction-heading {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
    font-size: 18;
}

.small {
    width: 50;
    margin: 20;
}
</style>
