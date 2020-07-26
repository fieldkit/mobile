<template>
    <StackLayout>
        <Label @tap="done">
            Dip In Solution
        </Label>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "../wrappers/vue";
import { _T } from "../utilities";

export default Vue.extend({
    props: {},
    data() {
        return {};
    },
    methods: {
        done(this: any) {
            this.$emit("done");
        },
    },
});
</script>

<style scoped lang="scss">
@import "../app-variables";
</style>
