<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <StackLayout>
            <Label>
                Calibrating
            </Label>
            <component
                :is="activeVisual.component"
                :step="activeStep"
                :visual="activeVisual"
                @done="(ev) => onDone(ev, activeStep)"
                @cancel="(ev) => onCancel(ev, activeStep)"
            />
        </StackLayout>
    </Page>
</template>
<script src="./Calibrate.ts" />
<style scoped lang="scss">
@import "../app-variables";
</style>
