<template>
    <GridLayout rows="50" columns="*" :class="cssClass + ' settings-item'" @tap="goToRoute()">
        <Label :text="_L(text)" class="size-16 m-5 v-middle" row="0" col="1" verticalAlignment="center" />
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { routes } from "@/routes";

export default Vue.extend({
    props: {
        link: {
            type: String,
            default: null,
        },
        text: {
            type: String,
            required: true,
        },
        cssClass: {
            type: String,
            default: "",
        },
    },
    methods: {
        async goToRoute(): Promise<void> {
            if (this.link) {
                // eslint-disable-next-line
                await this.$deprecatedNavigateTo(routes.appSettings[this.link], {});
            } else {
                this.$emit("tap");
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.settings-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
    padding-left: 10;
    padding-right: 10;
}
</style>
