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
    mounted(): void {
        console.log("md-node", this.node);
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

StackLayout {
    // background-color: green;
}

GridLayout {
    // background-color: red;
}
</style>
