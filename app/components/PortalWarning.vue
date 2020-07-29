<template>
    <StackLayout verticalAlignment="top"></StackLayout>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";

export default Vue.extend({
    data() {
        return {};
    },
    props: {},
    mounted(this: any) {
        console.log("mounted!");
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
