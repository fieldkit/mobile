<template>
    <MarkdownNode v-if="tree" :node="tree" :screen="screen" :frame="frame" />
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import MarkdownNode from "./MarkdownNode.vue";
import { transform, MdNode } from "./parsing";
import { SimpleScreen } from "./model";

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
        screen: {
            type: Object as PropType<SimpleScreen>,
            required: false,
        },
        frame: {
            type: Number,
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
        // eslint-disable-next-line
        const hasImages = this.screen.images.length > 0;
        this.tree = await transform(this.text, hasImages);
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
