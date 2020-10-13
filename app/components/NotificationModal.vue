<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout class="m-y-10 m-l-20 m-r-20">
                <GridLayout rows="auto" columns="85*,15*" class="header-section">
                    <StackLayout colSpan="2" verticalAlignment="middle">
                        <FlexboxLayout justifyContent="center" alignItems="center">
                            <Label class="text-center size-16 bold" :text="_L('notifications')"></Label>
                            <GridLayout rows="auto" columns="*" horizontalAlignment="left">
                                <Label row="0" col="0" text="2" class="notify-num text-center" @loaded="onLabelLoadedCentered"/>
                            </GridLayout>
                        </FlexboxLayout>
                    </StackLayout>
                    <StackLayout col="1" class="round-bkgd" verticalAlignment="top" @tap="$modal.close()">
                        <Image width="18" src="~/images/Icon_Close.png" />
                    </StackLayout>
                </GridLayout>
                <GridLayout v-for="n in activeNotifications" :key="n.id">
                    <GridLayout rows="*,*,*" columns="15*,85*" class="m-x-10 notify-box size-14">
                        <Image col="0" row="0" :src="n.error ? '~/images/Icon_Warning_error.png' : '~/images/Icon_Notification_Bell.png'" width="21" />
                        <Label col="1" row="0" :text="n.heading" textWrap="true" class="bold"  @loaded="onLabelLoadedVerticalCentered"/>
                        <Label col="1" row="1" :text="n.text" textWrap="true" lineHeight="4"/>
                        <GridLayout col="1" row="2" columns="auto,auto" class="size-12 bold" :dataId="n.id" @tap="dismiss">
                            <Label col="0" text="Add Field Notes" class="action-btn m-r-15"/>
                            <GridLayout col="1" columns="auto,auto" @tap="toggleMenu" :dataId="n.id">
                                <Label col="0" :text="_L('dismiss')" class="action-btn" :dataId="n.id" @tap="dismiss"/>
                                <Image col="1" src="~/images/Icon_Menu_Down.png" width="8" class="m-l-2" :class="isAndroid ? 'm-t-2' : 'm-t-8'"/>
                            </GridLayout>
                        </GridLayout>
                    </GridLayout>
                    <GridLayout rows="*,*" class="size-12 menu" horizontalAlignment="right" v-if="showMenu === n.id">
                        <Label row="0" :text="_L('notificationRemindLater')" textWrap="true" class="bold m-b-10" />
                        <Label row="1" :text="_L('notificationDontRemind')" textWrap="true" class="bold" />
                    </GridLayout>
                </GridLayout>
                <Label :text="_L('notificationArchive')" class="bold size-14 m-x-10 m-t-30 m-b-20"  @loaded="onLabelLoadedVerticalCentered" v-if="dismissedNotifications.length > 0"/>
                <GridLayout v-for="n in dismissedNotifications" :key="n.id">
                    <GridLayout rows="*,*,*" columns="15*,85*" class="m-x-10 notify-box size-14">
                        <Image col="0" row="0" src="~/images/Icon_Archive_Bell.png" width="21" />
                        <Label col="1" row="0" :text="n.heading" textWrap="true" class="bold"  @loaded="onLabelLoadedVerticalCentered"/>
                        <Label col="1" row="1" :text="n.text" textWrap="true" lineHeight="4"/>
                        <GridLayout col="1" row="2" columns="auto,auto" class="size-12 bold" :dataId="n.id">
                            <Label col="0" :text="'Add Field Notes'" class="action-btn m-r-15"/>
                            <GridLayout col="1" columns="auto,auto" @tap="toggleMenu" :dataId="n.id">
                                <Label col="0" :text="_L('dismiss')" class="action-btn" />
                                <Image col="1" src="~/images/Icon_Menu_Down.png" width="8" class="m-l-2" :class="isAndroid ? 'm-t-2' : 'm-t-8'"/>
                            </GridLayout>
                        </GridLayout>
                    </GridLayout>
                    <GridLayout rows="*,*" class="size-12 menu" horizontalAlignment="right" v-if="showMenu !== n.id">
                        <Label row="0" :text="_L('notificationRemindLater')" textWrap="true" class="bold m-b-10" />
                        <Label row="1" :text="_L('notificationDontRemind')" textWrap="true" class="bold" />
                    </GridLayout>
                </GridLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import {isAndroid, Label} from "@nativescript/core";
export default Vue.extend({
    data() {
        return {
            showMenu: -1
        };
    },
    props: {
        notifications: {
            type: Array
        },
    },
    computed: {
        isAndroid() {
            return isAndroid;
        },
        activeNotifications() {
            return this.notifications;
        },
        dismissedNotifications() {
            return this.notifications;
        }
    },
    methods: {
        onPageLoaded(this: any, args) {},
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
        toggleMenu(this: any, event) {
            this.showMenu = this.showMenu == event.object.dataId ? -1 : event.object.dataId;
        },
        dismiss(this: any, event) {
            // Change color when pressed
            // let cn = event.object.className;
            // event.object.className = cn + " pressed";
            // setTimeout(() => {
            //     event.object.className = cn;
            // }, 500);
            //
            // let id = event.object.dataId;
            // id = parseInt(id);
            // let index = this.notifications.findIndex((n) => {
            //     return n.id == id;
            // });
            // if (index > -1) {
            //     this.notifications.splice(index, 1);
            // }
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

.notify-box {
    padding-left: 0;
    padding-right: 10;
    padding-top: 10;
    padding-bottom: 10;
    border-width: 1;
    border-color: $fk-gray-lighter;
    height: 124;
    margin-bottom: 10;
}
.action-btn {
    margin-top: 10;
    border-radius: 4;
}

.menu {
    margin-top: 80;
    margin-bottom: 10;
    margin-right: 30;
    background-color: $background;
    border-width: 1;
    border-color: $fk-gray-lighter;
    padding: 10;
}
</style>
