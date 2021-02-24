<template>
    <MarkdownNode v-if="tree" :node="tree" />
</template>

<script lang="ts">
import Vue from "vue";
import MarkdownNode from "./MarkdownNode.vue";
import { transform, MdNode } from "./parsing";

export default Vue.extend({
    name: "Markdown",
    components: {
        MarkdownNode,
    },
    props: {
        text: {
            type: String,
            required: true,
        },
    },
    data(): {
        tree: MdNode | null;
    } {
        return {
            tree: null,
        };
    },
    async mounted(): Promise<void> {
        this.tree = await transform(this.text);
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
