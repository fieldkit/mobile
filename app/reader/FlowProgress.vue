<template>
    <GridLayout rows="auto" columns="*" class="top-line-bkgd">
        <StackLayout horizontalAlignment="left" :width="progress + '%'" class="top-line" />
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "FlowProgress",
    props: {
        progress: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {};
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.top-line-bkgd {
    background-color: $fk-gray-lighter;
    margin-bottom: 40;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
</style>
