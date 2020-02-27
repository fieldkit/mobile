<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="auto'">
            <StackLayout
                row="0"
                height="100%"
                backgroundColor="white"
                verticalAlignment="middle"
            >
                <GridLayout rows="auto, auto" columns="*">
                    <StackLayout row="0" id="loading-circle-blue"></StackLayout>
                    <StackLayout row="0" id="loading-circle-white"></StackLayout>
                    <Label
                        row="1"
                        class="instruction m-t-20"
                        text="Connecting"
                        lineHeight="4"
                        textWrap="true"
                    ></Label>
                </GridLayout>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../../routes";
import Services from "../../services/services";
import ConnectStationError from "./ConnectStationError";
import ConnectStationList from "./ConnectStationList";
import ConnectStationModules from "./ConnectStationModules";

export default {
    props: ["stepParam", "proceed", "stationParam"],
    data() {
        return {
            step: {},
            stations: [],
            stationOptions: []
        };
    },
    components: {
        ConnectStationError,
        ConnectStationList,
        ConnectStationModules
    },
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            this.$stationMonitor.subscribeAll(this.updateStations.bind(this));
            this.step = steps[this.stepParam];
            this.preShowSpinner();
            this.connectingTimer = setInterval(this.showSpinner, 1000);
            this.checkForConnections();
        },

        updateStations(data) {
            switch (data.propertyName.toString()) {
                case this.$stationMonitor.StationsUpdatedProperty: {
                    this.stations = data.value.filter(s => { return s.connected; });
                    break;
                }
            }
        },

        goNext() {
            this.step = steps[this.step.next];
            this.takeStep();
        },

        takeStep() {
            if (this.step && this.step.hasError) {
                this.goToError();
                return
            }
            if (this.proceed == "selectStation") {
                this.goToSelectStation();
                return
            }
            if (this.proceed == "startCalibration") {
                this.goToCalibration();
                return
            }
        },

        goToError() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(ConnectStationError, {
                props: {
                    stepParam: this.step.name
                }
            });
        },

        goToSelectStation() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(ConnectStationList, {
                props: {
                    stationOptionsParam: this.stationOptions
                }
            });
        },

        goToCalibration() {
            this.stopAnimation();
            this.unsubscribe();
            this.$navigateTo(ConnectStationModules, {
                props: {
                    stepParam: this.proceed,
                    stationParam: this.stationParam
                }
            });
        },

        stopAnimation() {
            this.loadingWhite = null;
            clearInterval(this.connectingTimer);
            this.connectingTimer = null;
        },

        preShowSpinner() {
            this.startedConnecting = Date.now();
            if (!this.loadingWhite) {
                // takes a sec for the elements to become defined
                // after this.testingConnection is set to true
                setTimeout(() => {
                    this.loadingWhite = this.page.getViewById("loading-circle-white");
                    if (this.loadingWhite) {
                        this.loadingWhite
                            .animate({
                                rotate: 360,
                                duration: 1000
                            });
                    }
                }, 250);
            }
        },

        showSpinner() {
            this.checkForConnections();
            // stop trying if > 5 sec
            if (Date.now() - this.startedConnecting > 5500) {
                clearInterval(this.connectingTimer);
                this.goNext();
            }
            if (this.loadingWhite) {
                this.loadingWhite.rotate = 0;
                this.loadingWhite
                    .animate({
                        rotate: 360,
                        duration: 1000
                    });
            }
        },

        checkForConnections() {
            if (this.stations && this.stations.length > 0) {
                clearInterval(this.connectingTimer);
                this.step.next = this.step.proceed;
                this.stationOptions = this.stations.map((s, i) => {
                    s.selected = i == 0;
                    return s;
                });
                this.goNext();
            } else {
                this.step.next = "trouble";
            }
        },

        unsubscribe() {
            this.$stationMonitor.unsubscribeAll();
        }
    }
};

const steps = {
    "trouble":
        {
            hasError: true,
            name: "trouble",
        },
    "testConnection":
       {
            prev: "",
            next: "",
            title: "",
            instructions: ["Connecting"],
            button: "",
            images: []
        }
};

</script>

<style scoped lang="scss">
// Start custom common variables
@import "../../app-variables";
// End custom common variables
// Custom styles
#loading-circle-blue,
#loading-circle-white {
    width: 75;
    height: 75;
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
.page {
    color: $fk-primary-black;
}
.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
</style>
