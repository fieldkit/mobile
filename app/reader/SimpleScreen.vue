<template>
    <StackLayout class="simple-screen">
        <StackLayout v-if="body.headings.length > 0" class="headings-container">
            <Label v-for="(heading, index) in body.headings" :key="index" class="heading" :text="heading" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout v-if="body.lines.length > 0" class="body-container">
            <Label v-for="(line, index) in body.lines" :key="index" class="body" :text="line" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout v-if="body.items.length > 0" class="items-container">
            <Label v-for="(item, index) in body.items" :key="index" class="item" :text="item" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout v-if="image" class="image-container">
            <Image verticalAlignment="middle" :src="'~/images/reader' + image.url" />
        </StackLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Body, SimpleScreen, parseBody } from "./model";

export default Vue.extend({
    name: "SimpleScreen",
    components: {},
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
    data() {
        return {};
    },
    computed: {
        image(): { url: string } | null {
            if (this.screen.images.length == 0) {
                return null;
            }
            return this.screen.images[this.frame % this.screen.images.length];
        },
        body(): Body {
            return parseBody(this.screen.body);
        },
    },
    methods: {},
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
