<template>
    <Image v-if="image" :src="'~/images/reader' + image.url" stretch="aspectFit" />
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { debug } from "@/lib";
import { SimpleScreen } from "./model";

export default Vue.extend({
    name: "MarkdownImage",
    props: {
        indices: {
            type: Array as PropType<number[]>,
            required: true,
        },
        alternate: {
            type: String,
            required: true,
        },
        screen: {
            type: Object as PropType<SimpleScreen>,
            required: false,
            default: null,
        },
        frame: {
            type: Number,
            required: true,
        },
    },
    computed: {
        image(): { url: string } | null {
            if (this.indices.length > 0) {
                const index = this.indices[this.frame % this.indices.length];
                return this.screen.images[index];
            }
            if (this.screen.images.length > 0) {
                return this.screen.images[this.frame % this.screen.images.length];
            }
            return null;
        },
    },
    mounted() {
        debug.log("mounted:indices", this.indices);
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

Image {
    // background-color: #afefaf;
}
</style>
