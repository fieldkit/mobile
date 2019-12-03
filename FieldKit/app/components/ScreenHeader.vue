<template>
    <!-- Fix Invalid handler when these aren't provdied? -->
    <GridLayout rows="auto" columns="15*,70*,15*" class="m-b-20">
        <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="onBack" v-if="canNavigateBack">
            <Image width="21" src="~/images/Icon_backarrow.png"></Image>
        </StackLayout>
        <GridLayout col="1" rows="auto,auto" columns="*">
            <Label row="0" class="title m-t-10 text-center" :text="title" textWrap="true"></Label>
            <Label row="1" class="text-center size-12" :text="subtitle" textWrap="true" :visible="subtitle"></Label>
        </GridLayout>
        <StackLayout col="2" class="round-bkgd" @tap="onSettings" v-if="canNavigateSettings">
            <Image width="25" src="~/images/Icon_Congfigure.png"></Image>
        </StackLayout>
    </GridLayout>
</template>

<script>
export default {
    props: {
        title: String,
        subtitle: {
            type: String,
            default: null,
        },
        onBack: {
            type: Function,
            default: () => { },
        },
        onSettings: {
            type: Function,
            default: () => { },
        },
        canNavigateBack: {
            type: Boolean,
            default: true,
        },
        canNavigateSettings: {
            type: Boolean,
            default: true,
        }
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

</style>
