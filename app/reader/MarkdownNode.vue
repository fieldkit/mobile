<template>
    <component v-bind:is="node.type" v-bind="node.props">
        <MarkdownNode v-for="(child, index) in node.children" :node="child" v-bind:key="index" />
    </component>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { MdNode } from "./parsing";

export default Vue.extend({
    name: "MarkdownNode",
    components: {},
    props: {
        node: {
            type: Object as PropType<MdNode>,
            required: true,
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

.md-tree {
    padding: 20;
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
}

.md-heading {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    font-weight: bold;
    font-size: 18;
    margin-bottom: 20;
}

.md-heading-0 {
    font-size: 18pt;
}

.md-heading-1 {
    font-size: 8pt;
}

.md-list {
    margin-top: 20;
}

.md-list-item {
    color: $fk-primary-black;
    text-align: left;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
</style>
