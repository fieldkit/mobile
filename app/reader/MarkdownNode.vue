<template>
    <component :is="node.type" v-bind="node.props">
        <MarkdownNode v-for="(child, index) in node.children" :key="index" :node="child" />
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
    // background-color: #a0a0a0;
    padding: 20;
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
}

.md-heading {
    color: $fk-primary-black;
    text-align: center;
    font-weight: bold;
    margin-bottom: 20;
}

.md-heading-1 {
    // background-color: #ddbb00;
    font-size: 18;
    line-height: 4;
}

.md-heading-2 {
    // background-color: #aabb00;
    font-family: "AvenirLTPro-Medium";
    text-color: #6a6d71;
    font-size: 12;
    line-height: 4;
}

.md-list {
    // background-color: #00a0a0;
    margin-top: 20;
}

.md-list-item {
    color: $fk-primary-black;
    text-align: left;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}

.md-grid {
    // background-color: #00aa00;
    font-size: 14;
    margin-top: 20;
    margin-bottom: 20;
    text-align: left;
}

.md-paragraph {
    // background-color: #8383aa;
    font-size: 18;
    line-height: 4;
    margin-bottom: 5;
}
</style>
