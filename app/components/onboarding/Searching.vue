<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" navigatingTo="onNavigatingTo">
        <GridLayout rows="auto">
            <StackLayout row="0" height="100%" backgroundColor="white" verticalAlignment="middle">
                <GridLayout rows="auto, auto" columns="*">
                    <StackLayout row="0" id="loading-circle-blue"></StackLayout>
                    <StackLayout row="0" id="loading-circle-white"></StackLayout>
                    <Label row="1" class="instruction m-t-20" :text="_L('connecting')" lineHeight="4" textWrap="true"></Label>
                </GridLayout>
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import Promise from "bluebird";

import routes from "@/routes";
import { LegacyStation } from "@/store/types";

export default Vue.extend({
    props: {
        reconnecting: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            left: false,
            failed: false,
            timer: null,
        };
    },
    computed: {
        numberOfNearbyStations(this: any): number {
            return this.$store.getters.availableStations.filter((s) => s.connected).length;
        },
    },
    watch: {
        numberOfNearbyStations(this: any, newValue, oldValue) {
            return this.foundStations(newValue);
        },
    },
    mounted(this: any) {
        console.log("searching:mounted");
        this.timer = Promise.delay(5000).then(() => {
            if (this.timer) {
                console.log("searching:failed");
                return this.$navigateTo(routes.onboarding.searchFailed, {
                    props: {
                        reconnecting: this.reconnecting,
                    },
                });
            }
        });
    },
    destroyed(this: any) {
        console.log("searching:destroyed");
        if (this.timer) {
            this.timer.cancel();
            this.timer = null;
        }
    },
    methods: {
        onPageLoaded(this: any, args) {
            if (this.numberOfNearbyStations) {
                return this.foundStations(this.numberOfNearbyStations);
            }
        },
        onNavigatingTo(this: any) {
            this.left = true;
        },
        foundStations(this: any, numberStations) {
            console.log("number of nearby stations", numberStations);

            if (this.timer) {
                this.timer.cancel();
                this.timer = null;
            }

            if (numberStations == 1) {
                if (true) {
                    return this.$navigateTo(routes.onboarding.nearby, {
                        props: {
                            reconnecting: this.reconnecting,
                        },
                    });
                }

                const legacyStations: LegacyStation[] = this.$store.getters.legacyStations;
                const connected = Object.values(legacyStations).filter((ls) => ls.connected);
                if (connected.length < 1) {
                    throw new Error("expected a connected station");
                }

                if (this.reconnecting) {
                    return this.$navigateTo(routes.onboarding.recalibrate, {
                        props: {
                            stationId: connected[0].id,
                        },
                    });
                } else {
                    return this.$navigateTo(routes.onboarding.network, {
                        props: {
                            stationId: connected[0].id,
                        },
                    });
                }
            }
            if (numberStations > 1) {
                return this.$navigateTo(routes.onboarding.nearby, {
                    props: {
                        reconnecting: this.reconnecting,
                    },
                });
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

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
