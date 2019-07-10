<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="*">
                    <StackLayout row="0" class="round m-y-10" @tap="goBack" horizontalAlignment="left">
                        <Image
                            width="21"
                            class="m-t-10"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <Label
                        row="0"
                        class="title m-y-20 text-center module-name"
                        :text="module.name"
                        textWrap="true"></Label>
                    <Image
                        row="0"
                        class="m-10"
                        width="14"
                        horizontalAlignment="right"
                        src="~/images/Icon_menu.png"></Image>
                </GridLayout>

                <!-- footer -->
                <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Data_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('data')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('settings')"></Label>
                    </StackLayout>
                </FlexboxLayout>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";
    const dbInterface = new DatabaseInterface();

    export default {
        data() {
            return {
                module: {
                    name: "",
                }
            };
        },
        props: ['moduleId', 'stationId'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;
                dbInterface.getModule([this.moduleId])
                    .then(module => {
                        this.module = module[0];
                    });
            },

            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.stationDetail, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },
        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles

    .round {
        width: 40;
        border-radius: 20;
    }

</style>