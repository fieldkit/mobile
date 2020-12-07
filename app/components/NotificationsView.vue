<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout class="m-y-10 m-l-20 m-r-20">
                <GridLayout rows="auto" columns="85*,15*" class="header-section">
                    <StackLayout colSpan="2" verticalAlignment="middle">
                        <FlexboxLayout justifyContent="center" alignItems="center">
                            <Label class="text-center size-16 bold" :text="_L('notifications')"></Label>
                            <GridLayout rows="auto" columns="*" horizontalAlignment="left">
                                <Label
                                    row="0"
                                    col="0"
                                    :text="activeNotifications.length"
                                    class="notify-num text-center"
                                    @loaded="onLabelLoadedCentered"
                                />
                            </GridLayout>
                        </FlexboxLayout>
                    </StackLayout>
                    <StackLayout col="1" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="18" src="~/images/Icon_Close.png" />
                    </StackLayout>
                </GridLayout>
                <GridLayout v-for="activeItem in activeNotifications" :key="activeItem.id">
                    <NotificationItem
                        :notification="activeItem"
                        :showMenu="showMenu"
                        @toggleMenu="toggleMenu"
                        @dismiss="dismiss"
                        @satisfy="satisfy"
                    ></NotificationItem>
                </GridLayout>
                <Label
                    :text="_L('notificationArchive')"
                    class="bold size-14 m-x-10 m-t-30 m-b-20"
                    @loaded="onLabelLoadedVerticalCentered"
                    v-if="dismissedNotifications.length > 0"
                />
                <GridLayout v-for="dismissedItem in dismissedNotifications" :key="dismissedItem.id">
                    <NotificationItem
                        :notification="dismissedItem"
                        :showMenu="showMenu"
                        @toggleMenu="toggleMenu"
                        @dismiss="dismiss"
                        @satisfy="satisfy"
                    ></NotificationItem>
                </GridLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import routes from "@/routes";
import { isAndroid, Label } from "@nativescript/core";
import { ActionTypes } from "@/store/actions";
import { Notification } from "@/store/modules/notifications";
import * as animations from "~/components/animations";
import NotificationItem from "~/components/NotificationItem.vue";
import Promise from "bluebird";

export default Vue.extend({
    data() {
        return {
            showMenu: [] as Array<number>,
        };
    },
    components: {
        NotificationItem,
    },
    computed: {
        isAndroid() {
            return isAndroid;
        },
        currentNotifications() {
            return this.$s.state.notifications.notifications;
        },
        activeNotifications() {
            return this.$s.state.notifications.notifications.filter((item: Notification) => item.silenced === false);
        },
        dismissedNotifications() {
            return this.$s.state.notifications.notifications.filter((item: Notification) => item.silenced === true);
        },
    },
    methods: {
        onPageLoaded(args) {},
        onLabelLoadedCentered(args) {
            const lbl = args.object as Label;
            if (isAndroid) {
                lbl.android.setGravity(17);
            }
        },
        onLabelLoadedVerticalCentered(args) {
            const lbl = args.object as Label;
            if (isAndroid) {
                lbl.android.setGravity(16);
            }
        },
        goBack(event) {
            return Promise.all([animations.pressed(event), this.$navigateTo(routes.stations, { clearHistory: true })]);
        },
        toggleMenu(notification) {
            this.showMenu = this.showMenu.includes(notification.id) ? [] : [notification.id];
        },
        dismiss(notification) {
            this.$s.dispatch(ActionTypes.DISMISS_NOTIFICATION, { key: notification.key, silenced: true });
        },
        satisfy(notification) {
            this.$s.dispatch(ActionTypes.SATISFY_NOTIFICATION, { key: notification.key });
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.header-section {
    margin-top: 5;
    margin-bottom: 35;
    color: $fk-primary-black;
}

.notify-num {
    font-size: 8;
    color: white;
    font-weight: bold;
    width: 15;
    height: 15;
    margin-left: 5;
    padding-top: 1;
    border-radius: 10;
    background-color: $fk-tertiary-red;
}
</style>
