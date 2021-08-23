<template>
    <Page>
        <ScrollView>
            <StackLayout class="p-20">
                <Image horizontalAlignment="right" width="17" class="m-t-10" src="~/images/Icon_Close.png" @tap="back" />
                <Label class="m-t-20 size-26" :text="_L('appSettings.tnc.title')" />
                <Label class="m-t-25 size-16" textWrap="true" :text="_L('appSettings.tnc.body')" />
                <Button
                    v-if="currentUser && !isTncValid"
                    class="btn btn-primary btn-padded m-t-25"
                    :text="_L('appSettings.tnc.agreeButton')"
                    @tap="agree"
                />
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { debug } from "@/lib";
import { CurrentUser, RemoveAccountAction } from "~/store";
import { fullRoutes } from "~/routes";

export default Vue.extend({
    name: "AppSettingsTncView",
    computed: {
        currentUser(): CurrentUser | null {
            return this.$s.state.portal.currentUser;
        },
        isTncValid(): boolean {
            return this.$services.PortalInterface().isTncValid();
        },
    },
    methods: {
        async back(): Promise<void> {
            if (this.isTncValid) {
                this.$navigateBack();
            } else {
                if (this.currentUser) {
                    await this.$s.dispatch(new RemoveAccountAction(this.currentUser.email));
                }
                // eslint-disable-next-line
                await this.$deprecatedNavigateTo(fullRoutes.login);
            }
        },
        async agree(): Promise<void> {
            if (!this.currentUser) {
                return;
            }
            try {
                const portal = this.$services.PortalInterface();
                await portal.accept(this.currentUser);
                // eslint-disable-next-line
                await this.$deprecatedNavigateTo(fullRoutes.onboarding.start);
            } catch (error) {
                debug.log("error", error);
                return;
            }
        },
    },
});
</script>
