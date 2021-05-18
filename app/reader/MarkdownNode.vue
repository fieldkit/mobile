<template>
    <component :is="node.type" v-bind="node.props" :screen="screen" :frame="frame">
        <MarkdownNode v-for="(child, index) in node.children" :key="index" :node="child" :screen="screen" :frame="frame" />
    </component>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { MdNode } from "./parsing";
import MarkdownRoot from "./MarkdownRoot.vue";
import MarkdownLink from "./MarkdownLink.vue";
import MarkdownImage from "./MarkdownImage.vue";

export default Vue.extend({
    name: "MarkdownNode",
    components: {
        MarkdownRoot,
        MarkdownLink,
        MarkdownImage,
    },
    props: {
        node: {
            type: Object as PropType<MdNode>,
            required: true,
        },
        frame: {
            type: Number,
            required: true,
        },
        screen: {
            type: Object,
            required: false,
            default: null,
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.md-tree {
    // background-color: #a0a0a0;
    padding: 20;
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
}

.md-heading {
    color: $fk-primary-black;
    font-family: "AvenirLTPro-Medium";
    text-align: center;
    font-weight: bold;
    margin-bottom: 20;
}

.md-heading-1 {
    // background-color: #0dbb00;
    font-size: 18;
    line-height: 4;
}

.md-heading-2 {
    // background-color: #00aa00;
    text-color: #6a6d71;
    font-size: 12;
    line-height: 4;
}

.md-list {
    // background-color: #00a0a0;
}

.md-list-item {
    // background-color: #a000a0;
    color: $fk-primary-black;
    text-align: left;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}

.md-seq-key {
    margin-right: 10;
}

.md-grid {
    font-size: 14;
    margin-bottom: 20;
    text-align: left;
}

.md-paragraph {
    // background-color: #8383aa;
    text-align: center;
    font-size: 18;
    line-height: 4;
    margin-bottom: 20;
}
</style>
