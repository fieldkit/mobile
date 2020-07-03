<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded" @unloaded="onUnloaded">
        <GridLayout :rows="notificationCodes.length > 0 ? '*,35,55' : '*,55'" v-if="currentStation">
            <ScrollView row="0">
                <FlexboxLayout flexDirection="column" class="p-t-10">
                    <ScreenHeader order="1" :title="currentStation.name" :subtitle="getDeployedStatus()" :onBack="goBack" :onSettings="goToSettings" />

                    <!-- loading animation -->
                    <GridLayout order="2" rows="auto" columns="*" v-if="loading" class="text-center">
                        <StackLayout id="loading-circle-blue"></StackLayout>
                        <StackLayout id="loading-circle-white"></StackLayout>
                    </GridLayout>

                    <!-- grid to allow overlapping elements -->
                    <GridLayout order="3" rows="*" columns="*">
                        <!-- background elements -->
                        <GridLayout row="0" col="0">
                            <FlexboxLayout flexDirection="column">
                                <!-- station status details -->
                                <StationStatusBox order="1" @deployTapped="goToDeploy" :station="currentStation" />
                                <!-- field notes section -->
                                <GridLayout order="2" rows="auto" columns="10*,55*,35*" v-if="isDeployed" class="m-t-5 m-b-10 m-x-10 p-10 bordered-container" @tap="goToFieldNotes">
                                    <Image col="0" width="25" src="~/images/Icon_FieldNotes.png"></Image>
                                    <Label col="1" :text="_L('fieldNotes')" class="size-16 m-l-10" verticalAlignment="middle" />
                                    <Label
                                        col="2"
                                        :text="percentComplete + '% ' + _L('complete')"
                                        class="size-16 blue"
                                        verticalAlignment="middle"
                                        v-if="percentComplete && percentComplete > 0"
                                    />
                                </GridLayout>
                                <!-- module list with current readings -->
                                <ModuleListView order="3" :station="currentStation" @moduleTapped="goToModule" />
                            </FlexboxLayout>
                        </GridLayout>
                        <!-- end background elements -->

                        <!-- foreground elements -->
                        <AbsoluteLayout row="0" col="0" class="text-center" v-if="newlyDeployed">
                            <!-- center dialog with grid layout -->
                            <GridLayout top="75" width="100%">
                                <StackLayout class="deployed-dialog-container">
                                    <Image width="60" src="~/images/Icon_Success.png"></Image>
                                    <Label :text="_L('stationDeployed')" class="deployed-dialog-text" />
                                </StackLayout>
                            </GridLayout>
                        </AbsoluteLayout>
                        <!-- end foreground elements -->
                    </GridLayout>
                </FlexboxLayout>
            </ScrollView>

            <!-- notifications -->
            <NotificationFooter row="1" :onClose="goToDetail" :notificationCodes="notificationCodes" v-if="notificationCodes.length > 0" />
            <!-- footer -->
            <ScreenFooter :row="notificationCodes.length > 0 ? '2' : '1'" active="stations" />
        </GridLayout>
    </Page>
</template>

<script>
import { BetterObservable } from "../services/rx";
import routes from "../routes";
import Services from "../services/services";
import Config from "../config";
import StationStatusBox from "./StationStatusBox";
import ModuleListView from "./ModuleListView";
import NotificationFooter from "./NotificationFooter";
import ScreenHeader from "./ScreenHeader";
import ScreenFooter from "./ScreenFooter";

const log = Config.logger("StationDetailView");

const dbInterface = Services.Database();

export default {
    data() {
        return {
            loading: true,
            percentComplete: 0,
            newlyDeployed: false,
            notificationCodes: [],
        };
    },
    computed: {
        isDeployed() {
            return this.currentStation.deployStartTime != null;
        },
        currentStation() {
            if (!this.$store.getters.legacyStations) {
                throw new Error(`missing legacyStations`);
            }
            return this.$store.getters.legacyStations[this.stationId];
        },
    },
    components: {
        ScreenHeader,
        StationStatusBox,
        ModuleListView,
        NotificationFooter,
        ScreenFooter,
    },
    props: {
        stationId: {
            type: Number,
        },
        station: {
            type: Object,
        },
        redirectedFromDeploy: {
            type: String,
        },
    },
    methods: {
        goBack(event) {
            // Change background color when pressed
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            return this.$navigateTo(routes.stations, {
                props: {
                    stationId: this.currentStation.id,
                    station: this.currentStation,
                },
                transition: {
                    name: "slideRight",
                    duration: 250,
                    curve: "linear",
                },
            });
        },

        goToDeploy(event) {
            return this.$navigateTo(routes.deployMap, {
                props: {
                    stationId: this.currentStation.id,
                    station: this.currentStation,
                },
            });
        },

        goToFieldNotes() {
            return this.$navigateTo(routes.deployNotes, {
                props: {
                    stationId: this.currentStation.id,
                    station: this.currentStation,
                    linkedFromStation: true,
                },
            });
        },

        goToModule(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            return this.$navigateTo(routes.module, {
                props: {
                    // remove the "m_id-" prefix
                    stationId: this.currentStation.id,
                    moduleId: event.object.id.split("m_id-")[1],
                    station: this.currentStation,
                },
            });
        },

        goToSettings(event) {
            // prevent taps before page finishes loading
            if (!this.currentStation || this.currentStation.id == 0) {
                return;
            }

            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            return this.$navigateTo(routes.stationSettings, {
                props: {
                    stationId: this.currentStation.id,
                    station: this.currentStation,
                },
            });
        },

        goToDetail(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            return this.$navigateTo(routes.stationDetail, {
                props: {
                    stationId: this.currentStation.id,
                },
            });
        },

        stopProcesses() {
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
            }
            if (this.$refs.statusBox) {
                this.$refs.statusBox.stopProcesses();
            }
        },

        onPageLoaded(args) {
            console.log("loading station detail");

            this.page = args.object;

            this.user = this.$portalInterface.getCurrentUser();

            // NOTE these are now hidden by the v-if initially.
            this.loadingBlue = this.page.getViewById("loading-circle-blue");
            this.loadingWhite = this.page.getViewById("loading-circle-white");
            this.intervalTimer = setInterval(this.showLoadingAnimation, 1000);

            if (this.currentStation) {
                this.stationId = Number(this.currentStation.id);
                this.completeSetup();
            }

            console.log("loaded station detail", this.stationId);
        },

        onUnloaded() {
            this.stopProcesses();
        },

        completeSetup() {
            this.loading = false;
            clearInterval(this.intervalTimer);

            if (this.redirectedFromDeploy) {
                this.newlyDeployed = true;
                setTimeout(() => {
                    this.newlyDeployed = false;
                }, 3000);
            }

            if (this.currentStation.portalError) {
                if (this.notificationCodes.indexOf(this.currentStation.portalError) == -1) {
                    this.notificationCodes.push(this.currentStation.portalError);
                }
            }

            this.currentStation.origName = this.currentStation.name;
        },

        getDeployedStatus() {
            return this.currentStation.deployStartTime ? _L("deployed", this.currentStation.deployStartTime) : _L("readyToDeploy");
        },

        showLoadingAnimation() {
            if (this.loadingWhite) {
                this.loadingWhite
                    .animate({
                        rotate: 360,
                        duration: 975,
                    })
                    .then(() => {
                        this.loadingWhite.rotate = 0;
                    });
            }
        },
    },
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
#loading-circle-blue,
#loading-circle-white {
    width: 90;
    height: 90;
    background: $fk-gray-white;
    border-width: 2;
    border-radius: 60%;
}
#loading-circle-white {
    border-color: $fk-gray-white;
    clip-path: circle(100% at 50% 0);
}
#loading-circle-blue {
    border-color: $fk-secondary-blue;
}
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}
.blue {
    color: $fk-primary-blue;
}

.deployed-dialog-container {
    border-radius: 4;
    background-color: $fk-gray-lightest;
    border-color: $fk-gray-lighter;
    border-width: 1;
    width: 225;
    height: 225;
    padding-top: 50;
}
.deployed-dialog-text {
    margin-top: 20;
    font-size: 18;
}
</style>
