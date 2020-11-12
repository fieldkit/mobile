<template>
    <GridLayout row="0" rows="*" columns="15*,70*,15*" class="m-y-20 header">
        <StackLayout v-if="canBack" col="0" class="round-bkgd" verticalAlignment="top" @tap="onBack">
            <Image width="21" src="~/images/Icon_Backarrow.png" />
        </StackLayout>
        <StackLayout col="1" verticalAlignment="middle">
            <Label class="title text-center" :text="header.title" textWrap="true" />
        </StackLayout>
        <StackLayout v-if="canCancel" col="2" class="round-bkgd" @tap="onCancel">
            <Image width="21" src="~/images/Icon_Close.png" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Header } from "./model";

export default Vue.extend({
    name: "Header",
    props: {
        header: {
            type: Object as PropType<Header>,
            required: true,
        },
        canBack: {
            type: Boolean,
            required: true,
        },
        canCancel: {
            type: Boolean,
            required: true,
        },
    },
    data() {
        return {};
    },
    methods: {
        onBack() {
            this.$emit("back");
        },
        onCancel() {
            this.$emit("cancel");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.header {
    height: 35;
}
</style>
