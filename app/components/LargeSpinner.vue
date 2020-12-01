<template>
    <GridLayout rows="auto, auto" columns="*">
        <StackLayout row="0" id="loading-circle-blue"></StackLayout>
        <StackLayout row="0" id="loading-circle-white"></StackLayout>
        <Label row="1" class="instruction m-t-20" :text="label" lineHeight="4" textWrap="true"></Label>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
// import { promiseAfter } from "@/utilities";

export default Vue.extend({
    props: {
        label: {
            type: String,
            required: true,
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

#loading-circle-blue,
#loading-circle-white {
    width: 75;
    height: 75;
    background: $fk-gray-white;
    border-width: 2;
    border-radius: 60%;
}
#loading-circle-white {
    border-color: $fk-gray-white;
    clip-path: circle(100% at 50% 0);
}
#loading-circle-blue {
    border-color: $fk-secondary-blue;
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
