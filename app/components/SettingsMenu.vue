<template>
    <ScrollView>
        <StackLayout>
            <slot></slot>
        </StackLayout>
    </ScrollView>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "SettingsMenu",
    props: {},
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
@import "~/_app-common";
</style>
