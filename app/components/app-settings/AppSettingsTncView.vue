<template>
    <Page actionBarHidden="true">
        <GridLayout :rows="currentUser && !isTncValid ? 'auto, *, 80' : '*'">
            <Label v-if="currentUser && !isTncValid" class="p-20 tnc-header" :text="_L('appSettings.tnc.updated')" textWrap="true" />
            <ScrollView row="1" @scroll="onScroll">
                <StackLayout class="p-20">
                    <StackLayout ref="tncLayout">
                        <HtmlView v-if="isIOS" :html="_L('appSettings.tnc.body')" />
                        <WebView v-if="isAndroid" :src="_L('appSettings.tnc.body')" />
                    </StackLayout>
                </StackLayout>
            </ScrollView>
            <GridLayout v-if="currentUser && !isTncValid" row="2" columns="*, *">
                <Button
                    col="0"
                    class="btn btn-primary btn-padded"
                    :class="{ pressed: !isTncRead }"
                    :text="_L('appSettings.tnc.agreeButton')"
                    @tap="agree"
                />
                <Button col="1" class="btn btn-primary btn-padded" :text="_L('appSettings.tnc.disagreeButton')" @tap="disagree" />
            </GridLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { CurrentUser, RemoveAccountAction } from "~/store";
import { fullRoutes, pages } from "~/routes";
import { EventData, isAndroid, isIOS, ScrollView } from "@nativescript/core";

export default Vue.extend({
    name: "AppSettingsTncView",
    data(): {
        isTncRead: boolean;
    } {
        return {
            isTncRead: false,
        };
    },
    computed: {
        currentUser(): CurrentUser | null {
            return this.$s.state.portal.currentUser;
        },
        isTncValid(): boolean {
            return this.$services.PortalInterface().isTncValid();
        },
        isAndroid(): boolean {
            return isAndroid;
        },
        isIOS(): boolean {
            return isIOS;
        },
    },
    methods: {
        async agree(): Promise<void> {
            if (!this.currentUser) {
                return;
            }
            try {
                if (this.isTncRead) {
                    const portal = this.$services.PortalInterface();
                    await portal.accept(this.currentUser);
                    // eslint-disable-next-line
                    await this.$navigateTo(pages.TabbedLayout, {
                        props: fullRoutes.onboarding.start.props,
                        clearHistory: true,
                    });
                }
            } catch (error) {
                return;
            }
        },
        async disagree(): Promise<void> {
            if (this.currentUser) {
                await this.$s.dispatch(new RemoveAccountAction(this.currentUser.email));
            }
            // eslint-disable-next-line
            await this.$navigateTo(pages.LoginView, { clearHistory: true });
        },
        onScroll(event: EventData) {
            const scrollView = <ScrollView>event.object;
            const whitespaceHeight = 100;
            const scrollOffset = scrollView.verticalOffset;
            if (scrollOffset > 0 && scrollOffset > scrollView.scrollableHeight - whitespaceHeight) {
                this.isTncRead = true;
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.tnc-header {
    background: $fk-orange;
}
</style>
