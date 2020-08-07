<template>
    <StackLayout class="simple-screen">
        <StackLayout class="body-container">
            <Label class="body" v-for="(line, index) in body.lines" :key="index" :text="line" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout class="items-container">
            <Label class="body" v-for="(item, index) in body.items" :key="index" :text="item" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout class="image-container" v-if="image">
            <Image verticalAlignment="middle" :src="'~/images/reader' + image.url" />
        </StackLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { Body, parseBody } from "./model";

export default Vue.extend({
    name: "SimpleScreen",
    components: {},
    props: {
        screen: {
            type: Object,
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
        image(): string | null {
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
.items {
    color: $fk-primary-black;
    text-align: left;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
.simple-screen {
}
</style>
