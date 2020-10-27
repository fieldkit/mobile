<template>
    <FlexboxLayout justifyContent="center" alignItems="center" class="notify-footer" @tap="showNotifications" @loaded="onLoaded">
        <Label class="size-14 m-t-5 m-b-5" :text="_L('notifications')" horizontalAlignment="right" />
        <GridLayout rows="auto" columns="*" horizontalAlignment="left">
            <Label row="0" col="0" :text="notifications.length" class="notify-num text-center" />
        </GridLayout>
    </FlexboxLayout>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";

export default Vue.extend({
    props: {
        notifications: {
            type: Array,
            required: true,
        },
    },
    methods: {
        onLoaded() {},
        showNotifications() {
            return this.$navigateTo(routes.notifications, {});
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.notify-footer {
    border-top-color: $fk-gray-lighter;
    color: $fk-primary-black;
    border-top-width: 1;
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
