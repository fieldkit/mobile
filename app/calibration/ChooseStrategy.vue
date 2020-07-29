<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="82,*,80">
            <Header row="0" :title="visual.title" :subtitle="visual.subtitle" :icon="visual.icon" @back="back" />
            <StackLayout row="1">
                <StackLayout class="choice-container">
                    <Label class="choice-heading" textWrap="true" text="Choose Calibration Type" />
                    <Label
                        class="choice-why"
                        textWrap="true"
                        text="For accurate data, set your module boards' baseline. More calibration points mean more precise readings."
                    />

                    <StackLayout
                        v-for="(strategy, index) in strategies"
                        :key="index"
                        class="strategy-container"
                        v-bind:class="{ selected: selected === index }"
                        @tap="choose(strategy, index)"
                    >
                        <Label col="1" class="m-t-5 m-l-5 heading" :text="strategy.heading" textWrap="true" />
                        <Label col="1" class="m-t-5 m-l-5 help" :text="strategy.help" textWrap="true" />
                    </StackLayout>
                </StackLayout>
            </StackLayout>
            <StackLayout row="2">
                <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="done" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import Header from "./Header.vue";

import { _T } from "../utilities";

import calibrationStrategies from "./strategies";

import { Common } from "./water";

export default Vue.extend({
    name: "ChooseStrategy",
    components: {
        Header,
    },
    props: {
        moduleKey: {
            type: String,
            required: true,
        },
    },
    data(): { selected: number } {
        return {
            selected: 0,
        };
    },
    computed: {
        strategies(this: any) {
            return calibrationStrategies().getModuleStrategies(this.moduleKey);
        },
        visual(this: any) {
            const common = Common();
            return common[this.moduleKey];
        },
    },
    methods: {
        onPageLoaded(this: any, args) {
            // console.log("loaded", calibrationStrategies);
        },
        choose(this: any, strategy: any, index: number) {
            this.selected = index;
        },
        done(this: any) {
            console.log("done");
            this.$emit("choose", this.strategies[this.selected]);
        },
        back(this: any) {
            console.log("back");
            this.$emit("back");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.choice-heading {
    text-align: center;
    color: #2c3e50;
    font-size: 18px;
    padding: 20;
}
.choice-why {
    text-align: center;
    font-size: 16px;
    color: #33465b;
    padding: 20;
}
.choice-container {
    padding: 20;
}
.strategy-container {
    display: block;
    margin-top: 10;
    margin-bottom: 10;
    border-color: #d8dce0;
    border-width: 2;
    border-radius: 4;
    padding: 10;
}
.strategy-container.selected {
    border-color: #1b80c9;
    border-width: 2;
    border-radius: 4;
}
.strategy-container .heading {
    font-size: 16px;
    color: #2c3e50;
}
.strategy-container .help {
    font-size: 14px;
    color: #2c3e50;
}
</style>
