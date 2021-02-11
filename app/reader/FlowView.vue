<template>
    <Page class="page" @navigatingTo="onNavigatingTo">
        <PlatformHeader
            :title="screen.header.title"
            :canCancel="true"
            :canNavigateSettings="false"
            :canNavigateBack="screen.navOptions.backward.allowed"
            :onBack="onBackward"
            :onCancel="onCancel"
        />
        <GridLayout rows="auto,*,auto" class="container">
            <FlowProgress row="0" :progress="progress" />
            <ScrollView row="1" class="container">
                <SimpleScreen v-if="screen.simple.length >= 1" :screen="screen.simple[0]" :frame="frame" class="simple-screen-container" />
            </ScrollView>
            <StackLayout row="2" class="m-x-10">
                <Button
                    class="btn btn-primary btn-padded"
                    :text="screen.forward"
                    :isEnabled="screen.navOptions.forward.allowed"
                    @tap="onForward"
                />
                <Label v-if="screen.skip" :text="screen.skip" class="skip" textWrap="true" @tap="onSkip" />
                <Label v-if="screen.guide_title" :text="screen.guide_title" class="skip" textWrap="true" @tap="onGuide" />
            </StackLayout>
        </GridLayout>
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
    },
    methods: {
        async onForward(): Promise<void> {
            console.log("forward", this.screen.name, this.screen.navOptions.forward);
            await this.nav.move(this.screen.navOptions.forward).then(async (done) => {
                if (done) {
                    console.log("flow-view: done");
                    await this.leave();
                }
                return;
            });
        },
        onBackward(): Promise<boolean> {
            console.log("backward", this.screen.name, this.screen.navOptions.backward);
            return this.nav.move(this.screen.navOptions.backward);
        },
        onNavigatingTo(): void {
            if (this.timer) {
                this.timer.stop();
                this.timer = null;
            }
        },
        async onSkip(): Promise<void> {
            console.log("flow-view: skip", this.screen.name);
            await this.nav.move(NavigationOption.Skip);
            await this.leave();
        },
        async onGuide(): Promise<void> {
            await Promise.resolve();
        },
        async onCancel(): Promise<void> {
            console.log("flow-view: cancel", this.screen.name);
            await this.leave();
        },
        async leave(): Promise<void> {
            // TODO: pass via prop?
            await this.$navigateTo(routes.tabbed, {
                frame: "outer-frame",
                // clearHistory: true,
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

.center-container {
    padding: 0;
    margin: 0;
}

.container {
    padding: 0;
    margin: 0;
}

.simple-screen-container {
}
</style>
