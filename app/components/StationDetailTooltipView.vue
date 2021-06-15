<template>
    <AbsoluteLayout :top="topPosition - (arrowDirection === 'up' || !showTooltip ? 0 : 200)" :left="0" width="100%" class="tooltip-layout">
        <Label
            :top="arrowDirection === 'up' || !showTooltip ? 2 : 200"
            :left="parseInt(leftPosition) + 2"
            width="15"
            height="15"
            class="tooltip-button"
        />
        <Label
            :top="arrowDirection === 'up' || !showTooltip ? 0 : 198"
            :left="parseInt(leftPosition)"
            width="19"
            height="19"
            class="tooltip-button-outer"
        />
        <template v-if="showTooltip">
            <template v-if="arrowDirection === 'up'">
                <GridLayout rows="*,*" class="tooltip-container" top="30" :left="textLeftPosition" width="270" backgroundColor="white">
                    <Label row="0" width="270" lineHeight="4" class="size-14" :text="instructionText" textWrap="true" />
                    <StackLayout row="1" orientation="horizontal" class="size-12">
                        <Label :text="_L('tooltipNext')" class="p-t-25 m-r-25" textWrap="true" @tap="nextTooltip" />
                        <Label :text="_L('tooltipHideAll')" class="p-t-25" textWrap="true" @tap="dismissTooltips" />
                    </StackLayout>
                </GridLayout>
                <Label top="21" :left="parseInt(leftPosition) - 2" class="arrow-up" />
                <Label top="31" :left="parseInt(leftPosition) - 5" style="background-color: white; height: 5; width: 30" />
            </template>
            <template v-if="arrowDirection === 'down'">
                <GridLayout rows="*,*" class="tooltip-container" top="10" :left="textLeftPosition" width="270" backgroundColor="white">
                    <Label row="0" width="270" lineHeight="4" class="size-14" :text="instructionText" textWrap="true" height="90" />
                    <StackLayout row="1" orientation="horizontal" class="size-12">
                        <Label v-if="showNextButton" :text="_L('tooltipNext')" class="p-t-25 m-r-25" textWrap="true" @tap="nextTooltip" />
                        <Label :text="_L('tooltipHideAll')" class="p-t-25" textWrap="true" @tap="dismissTooltips" />
                    </StackLayout>
                </GridLayout>
                <Label top="163" :left="parseInt(leftPosition) - 2" class="arrow-down" />
                <Label top="173" :left="parseInt(leftPosition) - 5" style="background-color: white; height: 5; width: 30" />
            </template>
        </template>
    </AbsoluteLayout>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        topPosition: {
            type: Number,
            required: true,
        },
        leftPosition: {
            type: Number,
            required: true,
        },
        instructionText: {
            type: String,
            required: true,
        },
        arrowDirection: {
            type: String,
            default: "up",
        },
        showTooltip: {
            type: Boolean,
            default: false,
        },
        showNextButton: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        textLeftPosition(): number {
            return this.leftPosition >= 270 ? this.leftPosition - 240 : 30;
        },
    },
    methods: {
        nextTooltip(): void {
            this.$emit("next-tool-tip");
        },
        dismissTooltips(): void {
            this.$emit("dismiss-tool-tips");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.tooltip-layout {
    background-color: transparent;

    .tooltip-button {
        background: $fk-secondary-blue;
        border-radius: 100%;
    }
    .tooltip-button-outer {
        border-radius: 100%;
        border-color: $fk-secondary-blue;
        border-width: 1;
    }
    .arrow-up {
        background-color: white;
        height: 25;
        width: 25;
        clip-path: polygon(50% 0%, 0% 50%, 100% 50%);
        border-width: 1;
        border-color: $fk-gray-border;
    }
    .arrow-down {
        background-color: white;
        height: 25;
        width: 25;
        clip-path: polygon(50% 100%, 0% 50%, 100% 50%);
        border-width: 1;
        border-color: $fk-gray-border;
    }
    .tooltip-container {
        padding: 20 10;
        border-width: 1;
        border-color: $fk-gray-border;
    }
}
</style>
