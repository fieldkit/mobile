<template>
    <GridLayout rows="auto" columns="*" class="top-line-bkgd progress-container">
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

.progress-container {
}
.top-line-bkgd {
    background-color: $fk-gray-lighter;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
</style>
