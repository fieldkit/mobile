<template>
    <GridLayout :height="height" :width="height">
        <RadRadialGauge>
            <RadialScale v-tkRadialGaugeScales startAngle="-90" sweepAngle="360">
                <ScaleStyle v-tkRadialScaleStyle ticksVisible="false" labelsVisible="false" lineThickness="0" />

                <RadialBarIndicator v-tkRadialScaleIndicators minimum="0" maximum="100">
                    <BarIndicatorStyle v-tkRadialBarIndicatorStyle :fillColor="fillBackgroundColor" cap="Round" barWidth="0.04" />
                </RadialBarIndicator>

                <RadialBarIndicator v-tkRadialScaleIndicators minimum="0" :maximum="value" :isAnimated="animated">
                    <BarIndicatorStyle v-tkRadialBarIndicatorStyle :fillColor="activeColor" cap="Round" :barWidth="value > 0 ? 0.09 : 0" />
                </RadialBarIndicator>
            </RadialScale>
        </RadRadialGauge>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        animated: { default: true },
        size: { default: 100 },
        progress: { default: 0 },
        offset: { default: 0 },
        textColor: { default: "#bfbfc4" },
        fillColor: { default: "#0A67AA" }, // $fk-primary-blue
        fillBackgroundColor: { default: "#F4F5F7" }, // $fk-gray-lightest
    },
    computed: {
        activeColor(this: any): string {
            // $fk-tertiary-green: #3F8530
            return this.value >= 100 ? "#3F8530" : this.fillColor;
        },
        height(this: any): number {
            return Math.min(this.size, 250);
        },
        value(this: any): number {
            return Math.min(this.progress, 100);
        },
        text(this: any): string {
            return `${this.value.toFixed()}%`;
        },
        textSize(this: any): number {
            return this.height / 3.5;
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";
</style>
