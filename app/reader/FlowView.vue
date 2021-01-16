<template>
    <Page class="page">
        <PlatformHeader
            :title="screen.header.title"
            :canCancel="true"
            :canNavigateSettings="false"
            :canNavigateBack="screen.navOptions.backward.allowed"
            :onBack="backward"
            :onCancel="cancel"
        />
        <StackLayout>
            <FlowProgress :progress="progress" />
            <GridLayout rows="*,auto">
                <StackLayout row="0">
                    <SimpleScreen v-if="screen.simple.length >= 1" :screen="screen.simple[0]" :frame="frame" />
                </StackLayout>
                <StackLayout row="1" class="m-x-10">
                    <Button
                        class="btn btn-primary btn-padded"
                        :text="screen.forward"
                        :isEnabled="screen.navOptions.forward.allowed"
                        @tap="forward"
                    />
                    <Label v-if="screen.skip" :text="screen.skip" class="skip" textWrap="true" @tap="skip" />
                </StackLayout>
            </GridLayout>
        </StackLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import FlowProgress from "./FlowProgress.vue";
import SimpleScreen from "./SimpleScreen.vue";
import PlatformHeader from "@/components/PlatformHeader";
import routes from "@/routes";
import flows from "@/data/flows.json";
import { Timer } from "@/common/timer";
import { FlowNavigator, NavigationOption, VisibleScreen } from "./model";

export default Vue.extend({
    name: "FlowView",
    components: {
        PlatformHeader,
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
    mounted(): void {
        this.timer = new Timer(1000, null);
        console.log("flows", flows);
    },
    destroyed(): void {
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
    },
    methods: {
        async forward(): Promise<void> {
            console.log("forward", this.screen.name, this.screen.navOptions.forward);
            await this.nav.move(this.screen.navOptions.forward).then((done) => {
                if (done) {
                    // TODO: pass via prop?
                    return this.$navigateTo(routes.stations, { clearHistory: true });
                }
                return;
            });
        },
        backward(): Promise<boolean> {
            console.log("backward", this.screen.name, this.screen.navOptions.backward);
            return this.nav.move(this.screen.navOptions.backward);
        },
        async skip(): Promise<void> {
            console.log("skip", this.screen.name);
            await this.nav.move(NavigationOption.Skip).then(() => {
                // TODO: pass via prop?
                return this.$navigateTo(routes.stations, { clearHistory: true });
            });
        },
        async cancel(): Promise<void> {
            console.log("cancel", this.screen.name);
            // TODO: pass via prop?
            await this.$navigateTo(routes.stations, { clearHistory: true });
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
