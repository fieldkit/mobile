<template>
    <GridLayout rows="auto, auto" columns="*">
        <ActivityIndicator busy="true" row="0"></ActivityIndicator>
        <Label row="1" class="instruction m-t-20" :text="label" lineHeight="4" textWrap="true"></Label>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";

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
