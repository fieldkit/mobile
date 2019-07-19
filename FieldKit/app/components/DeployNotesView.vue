<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <!-- <FlexboxLayout flexDirection="column" justifyContent="space-between"> -->
            <StackLayout>
                <GridLayout rows="auto" columns="10*,90*">
                    <StackLayout col="0" class="round" verticalAlignment="top" @tap="goBack">
                        <Image
                            width="21"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <StackLayout col="1" class="title-container m-t-10 m-r-30">
                        <Label
                            class="bold text-center"
                            :text="viewTitle"
                            textWrap="true"></Label>
                        <Label
                            class="bold m-b-10 text-center"
                            :text="station.name"
                            textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <GridLayout rows="auto" columns="*">
                    <StackLayout
                        row="0"
                        class="col left-col"
                        horizontalAlignment="left">
                        <Label class="text-center m-y-5 size-18" text="Audio Notes"></Label>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="col right-col"
                        horizontalAlignment="right">
                        <Label class="text-center m-y-5 size-18" text="Photos"></Label>
                    </StackLayout>
                </GridLayout>
            </StackLayout>
            <!-- </FlexboxLayout> -->
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
                viewTitle: "Deployment",
                station: {
                    name: "FieldKit Station",
                }
            };
        },
        props: ['stationId'],
        methods: {
            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.deployMap, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                dbInterface.getStation(this.stationId)
                    .then(this.completeSetup);
            },

            completeSetup(stations) {
                this.station = stations[0];
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
        padding-bottom: 10;
        padding-top: 8;
        margin-top: 1;
        border-radius: 20;
    }

    .col {
        width: 50%;
        border-width: 1;
        border-color: $fk-gray-lighter;
        background: $fk-gray-white;
        padding-top: 10;
        padding-bottom: 10;
    }

    .left-col {
        margin-left: 10;
        border-top-left-radius: 4;
        border-bottom-left-radius: 4;
    }

    .right-col {
        margin-right: 10;
        border-top-right-radius: 4;
        border-bottom-right-radius: 4;
    }

</style>