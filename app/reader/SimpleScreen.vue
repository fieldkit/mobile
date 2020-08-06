<template>
    <StackLayout>
        <StackLayout class="body-container">
            <Label class="body" v-for="(line, index) in body.lines" :key="index" :text="line" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout class="items-container">
            <Label class="body" v-for="(item, index) in body.items" :key="index" :text="item" lineHeight="4" textWrap="true" />
        </StackLayout>

        <StackLayout class="image-container" v-for="image in screen.images" :key="image.url">
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
    },
    data() {
        return {};
    },
    computed: {
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
</style>
