<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <Label @tap="calibrate">
            Hello, choose strategy
        </Label>
    </Page>
</template>

<script>
import Vue from "../wrappers/vue";
import routes from "../routes";
import { _T } from "../utilities";

import Calibrate from "./Calibrate.vue";
import calibrationStrategies from "./model";

export default Vue.extend({
    props: {},
    data() {
        return {};
    },
    methods: {
        onPageLoaded(args) {
            console.log("loaded", calibrationStrategies);
        },
        calibrate() {
            const strategy = calibrationStrategies.strategies[0];
            console.log("cal: strategy", strategy);
            return this.$navigateTo(Calibrate, {
                props: {
                    strategy: strategy,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";
</style>
