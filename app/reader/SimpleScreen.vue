<template>
    <Markdown :text="screen.body" class="markdown" :screen="screen" :frame="frame" />
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import Markdown from "./Markdown.vue";
import { SimpleScreen } from "./model";

export default Vue.extend({
    name: "SimpleScreen",
    components: {
        Markdown,
    },
    props: {
        screen: {
            type: Object as PropType<SimpleScreen>,
            required: true,
        },
        frame: {
            type: Number,
            required: true,
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.markdown {
    // background-color: blue;
    padding-bottom: 0;
    padding-top: 0;
}
</style>
