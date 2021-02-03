<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @navigatingTo="onNavigatingTo">
        <GridLayout rows="auto">
            <StackLayout row="0" height="100%" backgroundColor="white" verticalAlignment="middle">
                <LargeSpinner :label="_L('connecting')" />
            </StackLayout>
        </GridLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { Page } from "@nativescript/core";
import routes from "@/routes";
import { promiseAfter } from "@/utilities";
import { LegacyStation } from "@/store";
import LargeSpinner from "@/components/LargeSpinner.vue";

export default Vue.extend({
    props: {
        reconnecting: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        ...SharedComponents,
        LargeSpinner,
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
            const legacyStations: LegacyStation[] = Object.values(this.$s.getters.legacyStations);
            return legacyStations.filter((ls) => ls.connected).length;
        },
    },
    watch: {
        numberOfNearbyStations(newValue: number, oldValue: number): void {
            this.foundStations(newValue);
        },
    },
    mounted(): void {
        console.log(
            `searching:mounted ${JSON.stringify({ numberNearby: this.numberOfNearbyStations, nearby: this.$s.state.nearby.stations })}`
        );
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
    methods: {
        onPageLoaded(): void {
            if (this.numberOfNearbyStations) {
                this.foundStations(this.numberOfNearbyStations);
            }
        },
        onNavigatingTo(): void {
            console.log(`searching:onNavigatingTo`);
            if (this.timer) {
                console.log(`searching:left`);
                this.timer.cancel();
                this.timer = null;
            } else {
                console.log(`searching:left (no-timer)`);
            }
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

                const legacyStations: LegacyStation[] = Object.values(this.$s.getters.legacyStations);
                const connected = legacyStations.filter((ls) => ls.connected);
                if (connected.length < 1) {
                    throw new Error(`expected a connected station`);
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
</style>
