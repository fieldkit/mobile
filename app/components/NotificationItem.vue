<template>
    <GridLayout>
        <GridLayout rows="*,*,*" columns="15*,85*" class="m-x-10 notify-box size-14">
            <Image col="0" row="0"
                   :src="notificationsKind[notification.kind].error ? '~/images/Icon_Warning_error.png' : '~/images/Icon_Notification_Bell.png'"
                   width="21"/>
            <Label col="1" row="0" :text="notificationsKind[notification.kind].heading" textWrap="true" class="bold"
                   @loaded="onLabelLoadedVerticalCentered"/>
            <Label col="1" row="1" :text="notificationsKind[notification.kind].text" textWrap="true" lineHeight="4"/>
            <GridLayout col="1" row="2" columns="auto,auto" class="size-12 bold" @tap="dismiss">
                <Label col="0" text="Add Field Notes" class="action-btn m-r-15"/>
                <GridLayout col="1" columns="auto,auto" @tap="toggleMenu">
                    <Label col="0" :text="_L('dismiss')" class="action-btn" @tap="dismiss"/>
                    <Image col="1" src="~/images/Icon_Menu_Down.png" width="8" class="m-l-2"
                           :class="isAndroid ? 'm-t-2' : 'm-t-8'"/>
                </GridLayout>
            </GridLayout>
        </GridLayout>
        <GridLayout rows="*,*" class="size-12 menu" horizontalAlignment="right"
                    v-if="showMenu.includes(notification.id)">
            <Label row="0" :text="_L('notificationRemindLater')" textWrap="true" class="bold m-b-10" @tap="satisfy"/>
            <Label row="1" :text="_L('notificationDontRemind')" textWrap="true" class="bold" @tap="dismiss"/>
        </GridLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import {isAndroid, Label} from "@nativescript/core";

export default Vue.extend({
    data() {
        return {
            notificationsKind: {
                "unknown": {
                    heading: _L("portalProblemHeading"),
                    text: _L("encounteredAPortalError"),
                    error: true,
                },
                "station-owner-conflict": {
                    heading: _L("unableToUpdateHeading"),
                    text: _L("doNotHavePortalPermission"),
                    error: false,
                },
                "authentication": {
                    heading: _L("unableToAccessHeading"),
                    text: _L("notAuthorizedToUpdatePortal"),
                    error: true,
                },
                "station-deployed": {
                    heading: _L("stationDeployedHeading"),
                    text: _L("stationDeployedText"),
                    error: false,
                },
                "calibration-required": {
                    heading: _L("calibrationRequiredHeading"),
                    text: _L("calibrationRequiredText"),
                    error: false,
                },
            }
        };
    },
    props: {
        notification: {
            type: Object
        },
        showMenu: {
            type: Array
        }
    },
    computed: {
        isAndroid() {
            return isAndroid;
        }
    },
    methods: {
        onPageLoaded(this: any, args) {
        },
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
        toggleMenu() {
            this.$emit("toggleMenu", this.notification)
        },
        dismiss() {
            this.$emit("dismiss", this.notification)
        },
        satisfy() {
            this.$emit("satisfy", this.notification)
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

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
    margin-top: 60;
    margin-bottom: 10;
    margin-right: 10;
    background-color: $background;
    border-width: 1;
    border-color: $fk-gray-lighter;
    padding: 10;
}
</style>
