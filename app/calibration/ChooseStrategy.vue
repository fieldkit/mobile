<template>
    <GridLayout rows="*,auto">
        <ScrollView row="0" class="scroll-style" @tap="maybeDismissKeyboard">
            <GridLayout rows="auto,*" class="choice-container">
                <StackLayout row="0">
                    <Label class="choice-heading" textWrap="true" text="Choose Calibration Type" />

                    <Label
                        class="choice-why"
                        textWrap="true"
                        text="For accurate data, set your module boards' baseline. More calibration points mean more precise readings."
                    />
                </StackLayout>

                <StackLayout row="1">
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

                    <!-- This is so dumb. This keeps the final
                container from expanding in weird ways. No idea why
                and no time to dig deeper. Might be unnecessary after
                the layout changes to move button to the bottom. -->
                    <Label text=" " />
                </StackLayout>
            </GridLayout>
        </ScrollView>
        <StackLayout row="1">
            <Button class="btn btn-primary btn-padded" :text="visual.done" @tap="confirmStrategy" :isEnabled="enabled" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import Header from "./Header.vue";
import { CalibrationStrategy } from "./model";

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
        strategies: {
            type: Array as PropType<CalibrationStrategy[]>,
            required: true,
        },
        visual: {
            type: Object,
            required: true,
        },
        enabled: {
            type: Boolean,
            required: true,
        },
        busy: {
            type: Boolean,
            required: true,
        },
    },
    data(): {
        selected: number;
        strategy: CalibrationStrategy | null;
    } {
        return {
            selected: 0,
            strategy: null,
        };
    },
    methods: {
        choose(strategy: any, index: number): void {
            this.selected = index;
        },
        confirmStrategy(): void {
            this.strategy = this.strategies[this.selected];
            this.$emit("done", this.strategy);
        },
        maybeDismissKeyboard(): void {
            //
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
    padding-bottom: 20;
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
.btn-padded {
    margin-top: 10;
}
</style>
