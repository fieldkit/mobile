<template>
    <ActionBar backgroundColor="white" flat="true">
        <GridLayout rows="auto" columns="15*,70*,15*" class="m-t-20 m-b-10">
            <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="back">
                <Image width="21" src="~/images/Icon_Backarrow.png" />
            </StackLayout>
            <GridLayout col="1" rows="auto,auto" columns="*">
                <Label row="0" class="title m-t-10 m-b-5 text-center" :text="title" textWrap="true"></Label>
                <Label row="1" class="subtitle text-center" :text="subtitle" textWrap="true"></Label>
            </GridLayout>
            <StackLayout col="2" class="m-t-2 m-r-10">
                <Image width="35" :src="icon" />
            </StackLayout>
        </GridLayout>
    </ActionBar>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "Header",
    props: {
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            required: true,
        },
    },
    data() {
        return {};
    },
    methods: {
        back(this: any) {
            this.$emit("back");
        },
    },
});
</script>

<style scoped lang="scss"></style>
