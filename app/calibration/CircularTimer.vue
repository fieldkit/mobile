<template>
    <GridLayout row="1" rows="auto,auto" columns="*" class="timer-container">
        <GridLayout row="0" class="inner-circle">
            <FlexboxLayout verticalAlignment="middle" justifyContent="center" v-if="reading">
                <Label
                    :text="unitOfMeasure"
                    verticalAlignment="bottom"
                    class="m-r-5 m-t-5 size-14 calibration-unit"
                    v-show="unitOfMeasure && unitIsPrefix"
                />
                <Label flexShrink="0.25" :text="reading | prettyReading" verticalAlignment="bottom" class="size-26" />
                <Label
                    :text="unitOfMeasure"
                    verticalAlignment="bottom"
                    class="m-l-5 m-t-5 size-14 calibration-unit"
                    v-show="unitOfMeasure && !unitIsPrefix"
                />
            </FlexboxLayout>
        </GridLayout>
        <StackLayout row="0">
            <CircularProgressBar size="200" :progress="progress" :animated="animated" class="flip" />
        </StackLayout>
        <StackLayout row="1">
            <Label class="size-20 elapsed-time elapsed-time-top" :text="elapsedMs | prettyDuration"></Label>
            <Label class="size-14 elapsed-time" :text="elapsedMs | prettyDurationLabel"></Label>
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";

import CircularProgressBar from "../components/CircularProgressBar.vue";

export default Vue.extend({
    components: {
        CircularProgressBar,
    },
    props: {
        progress: {
            type: Number,
            required: true,
        },
        animated: {
            type: Boolean,
            required: true,
        },
        elapsed: {
            type: Number,
            required: true,
        },
        reading: {
            type: Number,
            default: null,
        },
        unitOfMeasure: {
            type: String,
            default: null,
        },
    },
    data() {
        return {};
    },
    computed: {
        elapsedMs(this: any) {
            return this.elapsed * 1000;
        },
        unitIsPrefix(this: any) {
            return this.unitOfMeasure.toLowerCase() == "ph";
        },
    },
    methods: {},
});
</script>

<style scoped lang="scss">
.timer-container {
    margin-top: 80;
    text-align: center;
}
.elapsed-time {
    text-align: center;
}
.elapsed-time-top {
    margin-top: 35;
    margin-bottom: 5;
}
.inner-circle {
    background-color: white;
    width: 190;
    height: 190;
}
</style>
