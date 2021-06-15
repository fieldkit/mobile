<template>
    <GridLayout :rows="rows">
        <slot></slot>
    </GridLayout>
</template>
<script lang="ts">
import _ from "lodash";
import Vue, { PropType } from "vue";
import { debug } from "@/lib";
import { MdNode } from "./parsing";

export default Vue.extend({
    name: "MarkdownRoot",
    props: {
        parsed: {
            type: Array as PropType<MdNode[]>,
            required: true,
        },
    },
    computed: {
        rows(): string {
            const rows = _.join(
                this.parsed.map((child, index) => this.getRowSpec(child, index)),
                ","
            );
            debug.log("markdown:rows", rows);
            return rows;
        },
    },
    methods: {
        findSizing(node: MdNode): string | null {
            if (node.props.sizing) {
                return node.props.sizing as string;
            }
            if (node.children) {
                for (const child of node.children) {
                    const sizing = this.findSizing(child);
                    if (sizing) {
                        return sizing;
                    }
                }
            }
            return null;
        },
        getRowSpec(node: MdNode, _index: number): string {
            // debug.log("markdown:node", node);
            const sizing = this.findSizing(node);
            return sizing || "auto";
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
</style>
