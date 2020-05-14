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

const noteContent = {
    1: {
        heading: "Problem with Portal connection",
        text: "We encountered an error when connecting to the Portal.",
        error: true,
    },
    403: {
        heading: "Unable to update Portal",
        text: "We do not have permission to update the Portal for this station. It may belong to another user.",
        error: true,
    },
    401: {
        heading: "Unable to access Portal",
        text: "We are currently not authorized to update the Portal. Are you logged in?",
        error: true,
    },
};

export default {
    data() {
        return {
            notifications: [],
        };
    },
    props: ["notificationCodes"],
    methods: {
        onLoaded() {
            this.notificationCodes.forEach((n, i) => {
                let note = noteContent[n];
                if (!note) {
                    let note = noteContent[1];
                }
                this.notifications.push({
                    id: i,
                    heading: note.heading,
                    text: note.text,
                    error: note.error,
                });
            });
        },
        showNotifications() {
            const options = {
                props: {
                    notifications: this.notifications,
                },
                fullscreen: true,
            };
            this.$showModal(NotificationModal, options);
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles
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
