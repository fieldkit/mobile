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
        console.log(`mounted:`, this.text);
        this.tree = await transform(this.text);
        console.log(`mounted:`, this.tree);
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
