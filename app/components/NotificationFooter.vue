<template>
    <FlexboxLayout justifyContent="center" alignItems="center" class="notify-footer" @tap="showNotifications" @loaded="onLoaded">
        <Label :text="_L('notifications')" horizontalAlignment="right" />
        <GridLayout rows="auto" columns="*" horizontalAlignment="left">
            <Label row="0" col="0" :text="notificationCodes.length" class="notify-num text-center" />
        </GridLayout>
    </FlexboxLayout>
</template>

<script lang="ts">
import Vue from "vue";
import NotificationModal from "./NotificationModal";

export default Vue.extend({
    data() {
        return {
            displayNotifications: {
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
            },
        };
    },
    props: {
        notificationCodes: {
            type: Array,
            required: true,
        },
    },
    computed: {
        notifications(this: any) {
            return this.notificationCodes.map((code) => {
                if (this.displayNotifications[code]) {
                    return this.displayNotifications[code];
                }
                return this.displayNotifications["unknown"];
            });
        },
    },
    methods: {
        onLoaded(this: any) {},
        showNotifications(this: any) {
            const options = {
                props: {
                    notifications: this.notifications,
                },
                fullscreen: true,
            };
            return this.$showModal(NotificationModal, options);
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
