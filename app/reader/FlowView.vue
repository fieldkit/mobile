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

/*
interface Self extends Vue {
    flowName: string;
    nav: FlowNavigator;
    screen: VisibleScreen;
    timer: Timer;
}
*/

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
    data(): {
        nav: FlowNavigator;
        timer: Timer | null;
    } {
        return {
            nav: new FlowNavigator(flows, this.flowName),
            timer: null,
        };
    },
    mounted(): void {
        this.timer = new Timer(1000, () => {});
        console.log("flows", flows);
    },
    destroyed(): void {
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
    },
    computed: {
        frame(): number {
            return this.timer?.counter || 0;
        },
        screen(): VisibleScreen {
            return this.nav.screen;
        },
        progress(): number {
            return this.nav.progress;
        },
    },
    methods: {
        forward(): Promise<void> {
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
        backward(): Promise<boolean> {
            console.log("backward", this.screen.name, this.screen.navOptions.backward);
            return this.nav.move(this.screen.navOptions.backward);
        },
        skip(): Promise<void> {
            console.log("skip", this.screen.name);
            return this.nav.move(NavigationOption.Skip).then(() => {
                // TODO: pass via prop?
                return this.$navigateTo(routes.stations, {
                    props: {},
                });
            });
        },
        cancel(): Promise<void> {
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
