<template>
    <WrapLayout class="md-link" @tap="onOpen">
        <slot></slot>
    </WrapLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { Utils } from "@nativescript/core";
import { debug } from "@/lib";

export default Vue.extend({
    name: "MarkdownLink",
    props: {
        target: {
            type: String,
            required: true,
        },
    },
    methods: {
        onOpen(): void {
            debug.log(this.target);
            Utils.openUrl(this.target);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

StackLayout {
}

GridLayout {
}

.md-link {
}

.md-link Label {
    text-color: #0000ff;
    color: #6a6dff;
}
</style>
