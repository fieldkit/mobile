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

                <RadialBarIndicator v-tkRadialScaleIndicators minimum="0" :maximum="value" isAnimated="true">
                    <BarIndicatorStyle v-tkRadialBarIndicatorStyle :fillColor="activeColor" cap="Round" barWidth="0.09"></BarIndicatorStyle>
                </RadialBarIndicator>
            </RadialScale>
        </RadRadialGauge>
        <!-- <Label :text="text" :color="textColor" :fontSize="textSize" class="m-x-auto m-y-auto" :marginTop="offset"></Label> -->
    </GridLayout>
</template>

<script>
export default {
    props: {
        size: { default: 100 },
        progress: { default: 0 },
        offset: { default: 0 },
        textColor: { default: '#bfbfc4' },
        fillColor: { default: '#0A67AA' }, // $fk-primary-blue
        fillBackgroundColor: { default: '#F4F5F7' }, // $fk-gray-lightest
    },
    computed: {
        activeColor() {
            // $fk-tertiary-green: #3F8530
            return this.value > 99 ? "#3F8530" : this.fillColor;
        },
        height() {
            return Math.min(this.size, 250)
        },
        value() {
            return Math.min(this.progress, 100)
        },
        text() {
            return `${this.value.toFixed()}%`
        },
        textSize() {
            return
            this.height / 3.5
        },
    },
}
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
// End custom common variables
// Custom styles
</style>
