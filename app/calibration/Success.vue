<template>
    <StackLayout height="100%" backgroundColor="white" verticalAlignment="middle">
        <GridLayout rows="auto,auto" columns="*">
            <Image row="0" src="~/images/Icon_Success.png" class="small"></Image>
            <Label row="1" :text="text" class="instruction-heading"></Label>
        </GridLayout>
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "Success",
    props: {
        text: {
            type: String,
            default: "",
        },
    },
    data() {
        return {};
    },
    computed: {},
    methods: {},
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction-heading {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
    font-size: 18;
}

.small {
    width: 50;
    margin: 20;
}
</style>
