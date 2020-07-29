<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout class="m-y-10">
                <!-- header section -->
                <GridLayout row="0" rows="auto" columns="85*,15*" class="header-section">
                    <StackLayout colSpan="2" verticalAlignment="middle">
                        <Label class="title text-center" :text="_L('notifications')"></Label>
                    </StackLayout>
                    <StackLayout col="1" class="round-bkgd" verticalAlignment="top" @tap="$modal.close()">
                        <Image width="21" src="~/images/Icon_Close.png" />
                    </StackLayout>
                </GridLayout>

                <GridLayout v-for="n in notifications" :key="n.id" rows="*,*,*" columns="15*,85*" class="m-y-5 m-x-15 notify-box">
                    <Image col="0" row="0" :src="n.error ? '~/images/Icon_Warning_error.png' : '~/images/notify-bell.png'" width="25" />
                    <Label col="1" row="0" :text="n.heading" textWrap="true" class="m-b-10" />
                    <Label col="1" row="1" :text="n.text" textWrap="true" lineHeight="4" />
                    <!-- <Label col="1" row="2" :text="_L('dismiss')" class="dismiss-btn" :dataId="n.id" @tap="dismiss" /> -->
                </GridLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    data() {
        return {};
    },
    props: ["notifications"],
    methods: {
        onPageLoaded(this: any, args) {},
        dismiss(this: any, event) {
            // Change color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            let id = event.object.dataId;
            id = parseInt(id);
            let index = this.notifications.findIndex((n) => {
                return n.id == id;
            });
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.header-section {
    margin-top: 5;
    margin-bottom: 40;
}

.notify-box {
    padding-left: 0;
    padding-right: 10;
    padding-top: 10;
    padding-bottom: 10;
    margin: 10;
    border-width: 1;
    border-radius: 4;
    border-color: $fk-gray-lighter;
}
.dismiss-btn {
    margin-top: 20;
    border-radius: 4;
}
</style>
