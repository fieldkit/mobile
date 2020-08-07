<template>
    <Page class="page" actionBarHidden="true">
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
                <SimpleScreen :screen="screen.simple[0]" v-if="screen.simple.length >= 1" :frame="frame" />
            </StackLayout>
            <StackLayout row="2" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded"
                    @tap="forward"
                    :text="screen.forward"
                    :isEnabled="screen.navOptions.forward.allowed"
                />
                <Label :text="screen.skip" class="skip" @tap="skip" textWrap="true" v-if="screen.skip" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import Header from "./Header.vue";
import FlowProgress from "./FlowProgress.vue";
import SimpleScreen from "./SimpleScreen.vue";
import routes from "@/routes";
import flows from "@/data/flows.json";

import { Timer } from "@/common/timer";

import { FlowNavigator, NavigationOption, VisibleScreen } from "./model";

// asdf;

interface Self extends Vue {
    flowName: string;
    nav: FlowNavigator;
    screen: VisibleScreen;
    timer: Timer;
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
            timer: null,
        };
    },
    mounted(this: Self) {
        this.timer = new Timer(1000, () => {});
        console.log("flows", flows);
    },
    destroyed(this: Self) {
        this.timer.stop();
    },
    computed: {
        frame(this: Self): number {
            return this.timer?.counter || 0;
        },
        screen(this: Self): VisibleScreen {
            return this.nav.screen;
        },
        progress(this: Self): number {
            return this.nav.progress;
        },
    },
    methods: {
        forward(this: Self) {
            console.log("forward", this.screen.name, this.screen.navOptions.forward);
            return this.nav.move(this.screen.navOptions.forward).then((done) => {
                if (done) {
                    // TODO: pass via prop?
                    return this.$navigateTo(routes.stations, {
                        props: {},
                    });
                }
                return false;
            });
        },
        backward(this: Self) {
            console.log("backward", this.screen.name, this.screen.navOptions.backward);
            return this.nav.move(this.screen.navOptions.backward);
        },
        skip(this: Self) {
            console.log("skip", this.screen.name);
            return this.nav.move(NavigationOption.Skip).then(() => {
                // TODO: pass via prop?
                return this.$navigateTo(routes.stations, {
                    props: {},
                });
            });
        },
        cancel(this: Self) {
            console.log("cancel", this.screen.name);
            // TODO: pass via prop?
            return this.$navigateTo(routes.stations, {
                props: {},
            });
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
