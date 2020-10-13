<template>
    <StackLayout height="100%" backgroundColor="white" verticalAlignment="middle">
        <GridLayout rows="*,80,60" columns="*">
            <StackLayout row="0" verticalAlignment="middle">
                <Image row="0" src="~/images/Icon_Warning_error.png" class="small"></Image>
                <Label row="1" :text="_L('calibrationFailed')" class="instruction-heading"></Label>
                <Label row="2" :text="_L('calibrationErrorOccured')" class="instruction" textWrap="true"></Label>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import { _T } from "../utilities";
import Vue from "vue";

export default Vue.extend({
    name: "Failure",
    props: {},
    data() {
        return {};
    },
    methods: {},
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

.skip {
    width: 200;
    padding-top: 10;
    padding-bottom: 10;
    font-size: 16;
    text-align: center;
}
</style>
