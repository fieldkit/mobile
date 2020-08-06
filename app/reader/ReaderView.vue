<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout rows="75,*,80">
            <GridLayout row="0" rows="auto" columns="15*,70*,15*" class="m-y-20">
                <template v-if="step > 0">
                    <StackLayout col="0" class="round-bkgd" verticalAlignment="top" @tap="goBack">
                        <Image width="21" src="~/images/Icon_Backarrow.png" />
                    </StackLayout>
                    <StackLayout col="1" verticalAlignment="middle">
                        <Label class="title text-center" :text="title" textWrap="true"></Label>
                    </StackLayout>
                    <StackLayout col="2" />
                </template>
            </GridLayout>

            <StackLayout row="1">
                <GridLayout order="1" rows="auto" columns="*" class="top-line-bkgd" v-if="step > 1">
                    <StackLayout horizontalAlignment="left" :width="percentDone + '%'" class="top-line"></StackLayout>
                </GridLayout>

                <Label order="2" v-if="step > 0" class="instruction" :text="instruction" lineHeight="4" textWrap="true"></Label>

                <GridLayout order="4" rows="*" columns="*">
                    <Image verticalAlignment="middle" v-if="displayFrame" :src="displayFrame"></Image>
                </GridLayout>
            </StackLayout>

            <StackLayout row="2" class="m-x-10">
                <Button v-if="step > 0" class="btn btn-primary btn-padded" :text="buttonText" @tap="goNext"></Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import routes from "@/routes";

export default Vue.extend({
    name: "ReaderView",
    components: {},
    props: {
        flow: {},
    },
    data() {
        return {};
    },
    methods: {
        onPageLoaded(this: any) {},
        onUnloaded(this: any) {},
        forward(this: any) {},
        skip(this: any) {},
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";
.illo {
    margin-top: 8%;
    width: 75%;
}
.skip {
    width: 115;
    padding-top: 10;
    padding-bottom: 10;
    background-color: white;
    font-size: 14;
    font-weight: bold;
    text-align: center;
}
.top-line-bkgd {
    background-color: $fk-gray-lighter;
    margin-bottom: 40;
}
.top-line {
    border-bottom-width: 3;
    border-bottom-color: $fk-primary-blue;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-right: 30;
    margin-left: 30;
}
</style>
