<template>
    <StackLayout class="settings-layout">
        <SettingsMenu v-if="scrollable">
            <slot></slot>
        </SettingsMenu>
        <template v-else>
            <slot></slot>
        </template>
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";
import SettingsMenu from "./SettingsMenu.vue";

export default Vue.extend({
    name: "SettingsLayout",
    components: {
        SettingsMenu,
    },
    props: {
        scrollable: {
            type: Boolean,
            default: false,
        },
    },
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";

.ns-ios .settings-layout {
    margin-top: 20;
}
</style>
