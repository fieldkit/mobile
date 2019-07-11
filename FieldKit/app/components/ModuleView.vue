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
                    <StackLayout row="0" class="round m-y-10" @tap="goToConfigure" horizontalAlignment="right">
                        <Image
                            width="25"
                            class="m-t-8"
                            src="~/images/Icon_Congfigure.png"></Image>
                    </StackLayout>
                </GridLayout>

                <GridLayout rows="auto" columns="*" class="location-container m-x-10">
                    <StackLayout
                        row="0"
                        class="m-y-8 m-x-5"
                        horizontalAlignment="left">
                        <Image width=100 src="~/images/placeholder_module_location.png"></Image>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="location-label m-y-8"
                        horizontalAlignment="right">
                        <Label class="size-14" :text="'Locate ' + module.name + ' here on your FieldKit station.'" textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <StackLayout id="sensors-container">
                    <GridLayout rows="auto, auto" columns="*" v-for="s in sensors" :key="s.sensor_id" class="m-10 p-10">
                        <StackLayout row="0">
                            <Label :text="(s.name == 'Configure Sensor' ? 'Recent readings' : s.name) + ' ' + s.unit" class="sensor-name size-16" />
                        </StackLayout>
                        <!-- faux recent readings -->
                        <StackLayout row="1">
                            <GridLayout rows="auto" columns="*" v-for="r in s.readings" :key="'r-' + r.toFixed(4)">
                                <Label :text="r.toFixed(1)" class="size-16" />
                            </GridLayout>
                        </StackLayout>
                    </GridLayout>
                </StackLayout>



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
                },
                sensors: [
                    {
                        name: "",
                        readings: [],
                    }
                ]
            };
        },
        props: ['moduleId', 'stationId'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;

                this.getModule()
                    .then(this.getSensors);
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

            goToConfigure(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                setTimeout(() => {
                    event.object.className = cn;
                }, 500);

                this.$navigateTo(routes.configureModule, {
                    props: {
                        moduleId: this.moduleId
                    }
                });
            },

            getModule() {
                return dbInterface.getModule(this.moduleId)
            },

            getSensors(module) {
                this.module = module[0];
                dbInterface.getSensors(this.moduleId)
                    .then(result => {
                        result.forEach(function(s) {
                            s.unit = s.unit != "" ? "(" + s.unit + ")" : s.unit;
                            s.readings = [];
                            let low = s.currentReading/2;
                            for(var i = 0; i < 14; i++) {
                                let reading = Math.random()*low + low;
                                s.readings.push(reading);
                            }
                        });
                        this.sensors = result;
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
    .module-name {
        width: 195;
    }

    .round {
        width: 40;
        border-radius: 20;
    }

    .location-container {
        border-radius: 4;
        border-color: $fk-gray-lighter;
        border-width: 1;
    }

    .location-label {
        width: 225;
    }

</style>