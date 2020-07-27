<template>
    <GridLayout :height="height" :width="height">
        <RadRadialGauge>
            <RadialScale v-tkRadialGaugeScales startAngle="-90" sweepAngle="360">
                <ScaleStyle v-tkRadialScaleStyle ticksVisible="false" labelsVisible="false" lineThickness="0"></ScaleStyle>

                <RadialBarIndicator v-tkRadialScaleIndicators minimum="0" maximum="100">
                    <BarIndicatorStyle
                        v-tkRadialBarIndicatorStyle
                        :fillColor="fillBackgroundColor"
                        cap="Round"
                        barWidth="0.04"
                    ></BarIndicatorStyle>
                </RadialBarIndicator>

                <RadialBarIndicator v-tkRadialScaleIndicators minimum="0" :maximum="value" :isAnimated="animated">
                    <BarIndicatorStyle
                        v-tkRadialBarIndicatorStyle
                        :fillColor="activeColor"
                        cap="Round"
                        :barWidth="value > 0 ? 0.09 : 0"
                    ></BarIndicatorStyle>
                </RadialBarIndicator>
            </RadialScale>
        </RadRadialGauge>
        <!-- <Label :text="text" :color="textColor" :fontSize="textSize" class="m-x-auto m-y-auto" :marginTop="offset"></Label> -->
    </GridLayout>
</template>

<script lang="ts">
export default {
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
        activeColor(this: any) {
            // $fk-tertiary-green: #3F8530
            return this.value > 99 ? "#3F8530" : this.fillColor;
        },
        height(this: any) {
            return Math.min(this.size, 250);
        },
        value(this: any) {
            return Math.min(this.progress, 100);
        },
        text(this: any) {
            return `${this.value.toFixed()}%`;
        },
        textSize(this: any) {
            return;
            this.height / 3.5;
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
</style>
