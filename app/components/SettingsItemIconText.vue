<template>
    <GridLayout rows="50" columns="30, *" class="bottom-bordered-item" :class="cssClass" @tap="goToRoute()">
        <Image width="20" height="20" :src="imageSrc" row="0" col="0" verticalAlignment="center"></Image>
        <Label :text="_L(text)" class="size-16 m-10 v-middle" row="0" col="1" verticalAlignment="center"/>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import routes from "@/routes";

export default Vue.extend({
    data() {
        return {};
    },
    props: {
        link: {
            type: String
        },
        text: {
            type: String
        },
        imageSrc: {
            type: String
        },
        cssClass: {
            type: String
        }
    },
    methods: {
        goToRoute() {
            if (this.link) {
                this.$navigateTo(routes.appSettings[this.link], {
                    clearHistory: true,
                });
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.bottom-bordered-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}
</style>
