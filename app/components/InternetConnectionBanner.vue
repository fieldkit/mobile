<template>
    <StackLayout v-if="!isOnline" orientation="horizontal" class="banner-internet">
        <Image width="20" class="banner-internet-img" src="~/images/Icon_Warning_error.png"></Image>
        <Label :text="_L('mustBeConnected')" />
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";

export default Vue.extend({
    name: "InternetConnectionBanner",
    props: {},
    data(): {
        isOnline: boolean;
    } {
        return {
            isOnline: true,
        };
    },
    async mounted(): Promise<void> {
        return await this.checkIfOnline();
    },
    methods: {
        async checkIfOnline() {
            try {
                await axios.request({ url: "https://google.com", timeout: 3000 });
                this.isOnline = true;
            } catch (e) {
                this.isOnline = false;
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.banner-internet {
    background: $fk-gray-lightest;
    padding: 10 15;
    font-size: 14;

    &-img {
        margin-right: 12;
    }
}
</style>
