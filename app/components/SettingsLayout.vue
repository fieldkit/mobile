<template>
    <StackLayout>
        <SettingsMenu>
            <slot></slot>
        </SettingsMenu>
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
    props: {},
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";
</style>
