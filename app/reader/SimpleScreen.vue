<template>
    <StackLayout class="simple-screen">
        <Markdown :text="screen.body" />

        <StackLayout v-if="image" class="image-container">
            <Image verticalAlignment="middle" :src="'~/images/reader' + image.url" />
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

.headings-container {
    padding: 30;
    background-color: blue;
}
.heading {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
    font-weight: bold;
    font-size: 18;
}

.body-container {
    padding: 30;
}
.body {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}

.items-container {
    padding: 30;
}
.item {
    color: $fk-primary-black;
    text-align: left;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
</style>
