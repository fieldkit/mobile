<template>
    <FlexboxLayout justifyContent="center" alignItems="center" class="notify-footer" @tap="goToNotifications">
        <Label :text="_L('notifications')" horizontalAlignment="right" />
        <GridLayout rows="auto" columns="*" horizontalAlignment="left">
            <Label row="0" col="0" :text="numNotifications" class="notify-num text-center" />
        </GridLayout>
    </FlexboxLayout>
</template>

<script>
import Config from "../config";
import routes from "../routes";

export default {
    data() {
        return {
            numNotifications: 2,
        };
    },
    props: {
        onClose: {
            type: Function,
            default: () => {},
        },
    },
    methods: {
        goToNotifications() {
            this.$navigateTo(routes.notifications, {
                props: {
                    onClose: this.onClose,
                },
            });
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
