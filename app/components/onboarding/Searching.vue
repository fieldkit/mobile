<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded" @navigatingTo="onNavigatingTo" @navigatingFrom="onNavigatingFrom">
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
import { routes } from "@/routes";
import { debug, promiseAfter } from "@/lib";
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
            debug.log("searching:watch:numberOfNearbyStations", newValue, oldValue);
            this.foundStations(newValue);
        },
    },
    mounted(): void {
        debug.log(
            `searching:mounted ${JSON.stringify({ numberNearby: this.numberOfNearbyStations, nearby: this.$s.state.nearby.stations })}`
        );
        this.timer = promiseAfter(5000).then(() => {
            if (this.timer) {
                debug.log("searching:failed");
                this.$deprecatedNavigateTo(routes.onboarding.searchFailed, {
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
        onNavigatingFrom(): void {
            debug.log(`searching:onNavigatingFrom`);
            if (this.timer) {
                debug.log(`searching:left`);
                this.timer.cancel();
                this.timer = null;
            } else {
                debug.log(`searching:left (no-timer)`);
            }
            this.left = true;
        },
        onNavigatingTo(): void {
            debug.log(`searching:onNavigatingTo`);
        },
        async foundStations(numberStations: number): Promise<void> {
            if (this.timer) {
                debug.log("found-stations", numberStations);
                this.timer.cancel();
                this.timer = null;
            } else {
                debug.log("found-stations, no timer ignored", numberStations);
                return;
            }

            if (numberStations == 1) {
                if (true) {
                    await this.$deprecatedNavigateTo(routes.onboarding.nearby, {
                        props: {
                            reconnecting: this.reconnecting,
                        },
                    });
                    return;
                }

                const legacyStations: LegacyStation[] = Object.values(this.$s.getters.legacyStations);
                const connected = legacyStations.filter((ls) => ls.connected);
                if (connected.length < 1) {
                    throw new Error(`expected a connected station`);
                }

                if (this.reconnecting) {
                    await this.$deprecatedNavigateTo(routes.onboarding.recalibrate, {
                        props: {
                            stationId: connected[0].id,
                            bookmark: true,
                        },
                    });
                } else {
                    await this.$deprecatedNavigateTo(routes.onboarding.network, {
                        props: {
                            stationId: connected[0].id,
                        },
                    });
                }
            }
            if (numberStations > 1) {
                await this.$deprecatedNavigateTo(routes.onboarding.nearby, {
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
