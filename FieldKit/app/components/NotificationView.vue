<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout class="m-y-10">
                <!-- header section -->
                <GridLayout
                    row="0"
                    rows="auto"
                    columns="85*,15*"
                    class="header-section"
                >
                    <StackLayout colSpan="2" verticalAlignment="middle">
                        <Label
                            class="title text-center"
                            :text="_L('notifications')"
                        ></Label>
                    </StackLayout>
                    <StackLayout
                        col="1"
                        class="round-bkgd"
                        verticalAlignment="top"
                        @tap="onClose"
                    >
                        <Image width="21" src="~/images/Icon_Close.png" />
                    </StackLayout>
                </GridLayout>

                <GridLayout
                    v-for="n in notifications"
                    :key="n.id"
                    rows="*,*,*"
                    columns="15*,85*"
                    class="m-y-5 m-x-15 notify-box"
                >
                    <Image col="0" row="0" src="~/images/notify-bell.png" width="25" />
                    <Label col="1" row="0" :text="n.heading" textWrap="true" />
                    <Label col="1" row="1" :text="n.text" textWrap="true" />
                    <Label col="1" row="2" :text="_L('dismiss')" class="dismiss-btn" />
                </GridLayout>
            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
export default {
    data() {
        return {
            notifications: [
                // temporary, example notification
                {
                    heading: "You haven't synced for awhile",
                    text: "Make sure you have enough room for data on your phone before heading out to the field."
                },
                {
                    heading: "You haven't synced for awhile",
                    text: "Make sure you have enough room for data on your phone before heading out to the field."
                },
            ]
        }
    },
    props: {
        onClose: {
            type: Function,
            default: () => {}
        }
    },
    methods: {
        onPageLoaded(args) {}
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

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
}
</style>
