<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <ChooseStrategy :moduleKey="moduleKey" :strategies="strategies" @choose="choose" />
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import { _T } from "../utilities";

import Calibrate from "./Calibrate.vue";
import ChooseStrategy from "./ChooseStrategy.vue";
import calibrationStrategies from "./strategies";

import { CalibrationStrategy } from "./model";

export default Vue.extend({
    name: "Start",
    components: {
        ChooseStrategy,
    },
    props: {
        stationId: {
            type: Number,
            required: true,
        },
        moduleKey: {
            type: String,
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
    },
    data(): {} {
        return {};
    },
    computed: {
        strategies(this: any) {
            return calibrationStrategies.getModuleStrategies(this.moduleKey);
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("loaded", calibrationStrategies);
        },
        choose(this: any, strategy: CalibrationStrategy) {
            console.log("strategy", strategy);
            return this.$navigateTo(Calibrate, {
                props: {
                    stationId: this.stationId,
                    position: this.position,
                    strategy: strategy,
                },
            });
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";

.choice-heading {
}
.choice-why {
}
.strategy-container {
    margin-bottom: 10;
    border: 1px solid black;
    border-radius: 4px;
}
</style>
