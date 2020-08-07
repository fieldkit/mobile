<template>
    <Page class="page" actionBarHidden="true" @loaded="onLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto,*,auto">
            <StackLayout row="0">
                <Header
                    :header="screen.header"
                    @back="backward"
                    :canBack="screen.navOptions.backward.allowed"
                    @cancel="cancel"
                    :canCancel="true"
                />
                <FlowProgress :progress="progress" />
            </StackLayout>
            <StackLayout row="1">
                <SimpleScreen :screen="screen.simple[0]" v-if="screen.simple.length >= 1" />
            </StackLayout>
            <StackLayout row="2" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded"
                    @tap="forward"
                    :text="screen.forward"
                    :isEnabled="screen.navOptions.forward.allowed"
                />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import Header from "./Header.vue";
import FlowProgress from "./FlowProgress.vue";
import SimpleScreen from "./SimpleScreen.vue";

import flows from "@/data/flows.json";

import { FlowNavigator, NavigationOption, VisibleScreen } from "./model";

// asdf;

interface Self extends Vue {
    flowName: string;
    nav: FlowNavigator;
    screen: VisibleScreen;
}

export default Vue.extend({
    name: "FlowView",
    components: {
        Header,
        FlowProgress,
        SimpleScreen,
    },
    props: {
        flowName: {
            type: String,
            required: true,
        },
    },
    data(this: Self) {
        return {
            nav: new FlowNavigator(flows, this.flowName),
        };
    },
    computed: {
        screen(this: Self): VisibleScreen {
            return this.nav.screen;
        },
        progress(this: Self): number {
            return this.nav.progress;
        },
    },
    methods: {
        onLoaded(this: Self) {
            console.log("flows", flows);
        },
        onUnloaded(this: Self) {},
        forward(this: Self) {
            console.log("forward", this.screen.navOptions.forward);
            return this.nav.move(this.screen.navOptions.forward);
        },
        backward(this: Self) {
            console.log("backward", this.screen.navOptions.backward);
            return this.nav.move(this.screen.navOptions.backward);
        },
        skip(this: Self) {
            console.log("skip");
            return this.nav.move(NavigationOption.Skip);
        },
        cancel(this: Self) {
            console.log("cancel");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
.skip {
    width: 115;
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
}
</style>
