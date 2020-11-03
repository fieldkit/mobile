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
import { Page } from "@nativescript/core";
import Vue from "vue";
import routes from "@/routes";
import { LegacyStation } from "@/store/types";
import { promiseAfter } from "@/utilities";

export default Vue.extend({
    props: {
        reconnecting: {
            type: Boolean,
            default: false,
        },
    },
    data(): {
        left: boolean;
        failed: boolean;
        timer: any;
    } {
        return {
            left: false,
            failed: false,
            timer: null,
        };
    },
    computed: {
        numberOfNearbyStations(): number {
            return this.$store.getters.availableStations.filter((s) => s.connected).length;
        },
    },
    watch: {
        numberOfNearbyStations(newValue: number, oldValue: number): void {
            this.foundStations(newValue);
        },
    },
    mounted(): void {
        console.log("searching:mounted");
        this.timer = promiseAfter(5000).then(() => {
            if (this.timer) {
                console.log("searching:failed");
                this.$navigateTo(routes.onboarding.searchFailed, {
                    props: {
                        reconnecting: this.reconnecting,
                    },
                });
            }
        });
    },
    destroyed(): void {
        console.log("searching:destroyed");
        if (this.timer) {
            this.timer.cancel();
            this.timer = null;
        }
    },
    methods: {
        onPageLoaded(): void {
            if (this.numberOfNearbyStations) {
                this.foundStations(this.numberOfNearbyStations);
            }
        },
        onNavigatingTo(): void {
            this.left = true;
        },
        foundStations(numberStations: number): Promise<Page | void> {
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

            return Promise.resolve();
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
