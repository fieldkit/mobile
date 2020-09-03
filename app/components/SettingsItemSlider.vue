<template>
    <GridLayout rows="60" columns="*, 50" class="bottom-bordered-item" :class="cssClass">
        <StackLayout row="0" col="0" verticalAlignment="center" backgroundColor="white">
            <Label :text="_L(title)" class="size-16 m-2 v-middle" backgroundColor="white"/>
            <Label :text="_L(description)" class="size-12 m-2 v-middle" backgroundColor="white"/>
        </StackLayout>
        <GridLayout row="0" col="1" verticalAlignment="center" >
            <GridLayout class="wrapSwitch">
                <GridLayout verticalAlignment="center" borderRadius="50" borderColor="#d8dce0" borderWidth="2" width="50" >
                    <Switch :checked="value" offBackgroundColor="#fcfcfc" @tap="handleInput"/>
                </GridLayout>
            </GridLayout>
        </GridLayout>
    </GridLayout>
    </template>
<script lang="ts">
    import Vue from "vue";

    export default Vue.extend({
        data() {
            return {
                content: this.value
            };
        },
        props: {
            title: {
                type: String
            },
            description: {
                type: String
            },
            cssClass: {
                type: String
            },
            value: {
                type: Boolean
            }
        },
        methods: {
            handleInput (e) {
                this.$emit('input', !this.value)
                this.$emit('change', !this.value)
            }
        },
    });
</script>
<style scoped lang="scss">
    @import "~/_app-variables";

    Switch[checked=true] {
        color: #1b80c9;
        background-color: white;
    }
    Switch[checked=false] {
        color: #6a6d71;
        background-color: white;
    }
    .wrapSwitch {
        transform: scale(0.50, 0.50);
    }
    .bottom-bordered-item {
        border-bottom-color: $fk-gray-lighter;
        border-bottom-width: 1;
    }

    .top-bordered-item {
        border-top-color: $fk-gray-lighter;
        border-top-width: 1;
    }
</style>
