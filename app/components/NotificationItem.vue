<template>
    <GridLayout>
        <GridLayout rows="*,*,*" columns="15*,85*" class="m-x-10 notify-box size-14">
            <Image
                col="0"
                row="0"
                :src="
                    notificationsKind[notification.kind].error
                        ? '~/images/Icon_Warning_error.png'
                        : notification.silenced
                        ? '~/images/Icon_Archive_Bell.png'
                        : '~/images/Icon_Notification_Bell.png'
                "
                width="21"
            />
            <Label
                col="1"
                row="0"
                :text="notificationsKind[notification.kind].heading"
                textWrap="true"
                class="bold"
                @loaded="onLabelLoadedVerticalCentered"
            />
            <Label col="1" row="1" :text="notificationsKind[notification.kind].text" textWrap="true" lineHeight="4" />
            <GridLayout col="1" row="2" columns="auto,auto,*" class="size-12 bold">
                <Label
                    col="0"
                    v-if="!notificationsKind[notification.kind].buttonRoute"
                    :text="_L('addFieldNotes')"
                    class="action-btn m-r-15"
                    @tap="addFieldNotes"
                />
                <Label
                    col="0"
                    v-if="notificationsKind[notification.kind].buttonRoute"
                    :text="notificationsKind[notification.kind].buttonText"
                    class="action-btn m-r-15"
                    @tap="routeButton"
                />
                <GridLayout
                    v-if="!notification.satisfiedAt && notification.silenced === false"
                    col="1"
                    columns="auto,auto"
                    @tap="toggleMenu"
                >
                    <Label col="0" :text="_L('dismiss')" class="action-btn" />
                    <Image col="1" src="~/images/Icon_Menu_Down.png" width="8" class="m-l-2" :class="isAndroid ? 'm-t-2' : 'm-t-8'" />
                </GridLayout>
                <Label col="2" :text="prettyCreatedAt(notification.created)" horizontaAlign="right" class="notify-date" />
            </GridLayout>
        </GridLayout>
        <GridLayout rows="*,*" class="size-12 menu" horizontalAlignment="right" v-if="showMenu.includes(notification.id)">
            <Label row="0" :text="_L('notificationRemindLater')" textWrap="true" class="bold p-10" @tap="dismiss" />
            <Label row="1" :text="_L('notificationDontRemind')" textWrap="true" class="bold p-10" @tap="satisfy" />
        </GridLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
import { isAndroid, Label } from "@nativescript/core";
import { _L } from "@/lib";
import { fullRoutes } from "~/routes";
import moment from "moment";

export default Vue.extend({
    data() {
        return {
            notificationsKind: {
                unknown: {
                    heading: _L("portalProblemHeading"),
                    text: _L("encounteredAPortalError"),
                    error: true,
                },
                "station-owner-conflict": {
                    heading: _L("unableToUpdateHeading"),
                    text: _L("doNotHavePortalPermission"),
                    error: false,
                },
                authentication: {
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
                "calibration-before-deployment": {
                    heading: _L("calibrationBeforeDeploymentHeading"),
                    text: _L("calibrationBeforeDeploymentText"),
                    error: false,
                    buttonText: _L("calibrationBeforeDeploymentButton"),
                    buttonRoute: fullRoutes.onboarding.recalibrate,
                },
            },
        };
    },
    props: {
        notification: {
            type: Object,
        },
        showMenu: {
            type: Array,
        },
    },
    computed: {
        isAndroid() {
            return isAndroid;
        },
    },
    methods: {
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
            this.$emit("toggleMenu", this.notification);
        },
        dismiss() {
            this.$emit("dismiss", this.notification);
        },
        satisfy() {
            this.$emit("satisfy", this.notification);
        },
        addFieldNotes() {
            this.$emit("addFieldNotes", this.notification);
        },
        routeButton() {
            this.$emit("routeButton", {
                notification: this.notification,
                route: this.notificationsKind[this.notification.kind].buttonRoute,
            });
        },
        prettyCreatedAt(epoch: number): string {
            return moment(epoch).format("MMM D, h:mm a");
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
}

.notify-date {
    font-size: 9;
    color: $fk-gray-hint;
    margin-top: 10;
    text-align: right;
}
</style>
