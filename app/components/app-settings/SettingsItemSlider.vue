<template>
    <GridLayout :rows="description ? '60' : '50'" columns="*, 50" class="bottom-bordered-item" :class="cssClass">
        <StackLayout row="0" col="0" verticalAlignment="center" backgroundColor="white" class="m-r-30 label-container">
            <Label :text="_L(title)" class="size-16 m-2 v-middle" backgroundColor="white" />
            <Label :text="_L(description)" v-if="description" class="size-12 m-2 v-middle" backgroundColor="white" textWrap="true" />
        </StackLayout>
        <GridLayout row="0" col="1" verticalAlignment="center">
            <GridLayout class="wrap-switch">
                <GridLayout verticalAlignment="center" borderRadius="50" borderColor="#d8dce0" borderWidth="2" width="50">
                    <Switch :checked="content" offBackgroundColor="#fcfcfc" @tap="handleInput" v-if="enabled" />
                    <Switch :isEnabled="enabled" v-else />
                </GridLayout>
            </GridLayout>
        </GridLayout>
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    data(): {
        content: boolean;
    } {
        return {
            content: this.value,
        };
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        cssClass: {
            type: String,
            default: "",
        },
        value: {
            type: Boolean,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        handleInput(e) {
            console.log("input", !e.object.checked);
            this.$emit("input", !e.object.checked);
            this.$emit("change", !e.object.checked);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

Switch[checked="true"] {
    color: #1b80c9;
    background-color: white;
}

Switch[checked="false"] {
    color: #6a6d71;
    background-color: white;
}

.wrap-switch {
    transform: scale(0.5, 0.5);
}

.bottom-bordered-item {
    border-bottom-color: $fk-gray-lighter;
    border-bottom-width: 1;
}

.top-bordered-item {
    border-top-color: $fk-gray-lighter;
    border-top-width: 1;
}

.label-container {
    padding-left: 10;
    padding-right: 10;
}
</style>
