<template>
    <StackLayout class="simple-screen">
        <Markdown :text="screen.body" class="markdown" />

        <StackLayout v-if="image" class="image-container">
            <Image verticalAlignment="middle" :src="'~/images/reader' + image.url" stretch="aspectFit" />
        </StackLayout>
    </StackLayout>
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
    computed: {
        image(): { url: string } | null {
            if (this.screen.images.length == 0) {
                return null;
            }
            return this.screen.images[this.frame % this.screen.images.length];
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

.image-container {
    // background-color: orange;
}
</style>
