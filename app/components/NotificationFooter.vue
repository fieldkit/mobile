<template>
    <FlexboxLayout justifyContent="center" alignItems="center" class="notify-footer" @tap="showNotifications" @loaded="onLoaded">
        <Label :text="_L('notifications')" horizontalAlignment="right" />
        <GridLayout rows="auto" columns="*" horizontalAlignment="left">
            <Label row="0" col="0" :text="notificationCodes.length" class="notify-num text-center" />
        </GridLayout>
    </FlexboxLayout>
</template>

<script>
import Config from "../config";
import NotificationModal from "./NotificationModal";
import * as i18n from "tns-i18n";
// Note: i18n detects the preferred language on the phone,
// and this default language initialization does not override that
i18n("en");

const displayNotifications = {
    unknown: {
        heading: _L("portalProblemHeading"),
        text: _L("encounteredAPortalError"),
        error: true,
    },
    "station-owner-conflict": {
        heading: _L("unableToUpdateHeading"),
        text: _L("doNotHavePortalPermission"),
        error: true,
    },
    authentication: {
        heading: _L("unableToAccessHeading"),
        text: _L("notAuthorizedToUpdatePortal"),
        error: true,
    },
};

export default {
    data() {
        return {};
    },
    props: {
        notificationCodes: {
            type: Array,
            required: true,
        },
    },
    computed: {
        notifications() {
            return this.notificationCodes.map((code) => {
                if (displayNotifications[code]) {
                    return displayNotifications[code];
                }
                return displayNotifications["unknown"];
            });
        },
    },
    methods: {
        onLoaded() {},
        showNotifications() {
            const options = {
                props: {
                    notifications: this.notifications,
                },
                fullscreen: true,
            };
            return this.$showModal(NotificationModal, options);
        },
    },
};
</script>

<style scoped lang="scss">
@import "../app-variables";

.notify-footer {
    border-top-color: $fk-gray-lightest;
    border-top-width: 2;
    margin-bottom: 5;
    height: 100%;
}
.notify-num {
    font-size: 11;
    color: white;
    font-weight: bold;
    width: 15;
    height: 15;
    margin-left: 5;
    padding-top: 1;
    border-radius: 10;
    background-color: $fk-primary-red;
}
</style>
