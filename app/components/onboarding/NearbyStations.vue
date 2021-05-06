<template>
    <Page @navigatingFrom="onNavigatingFrom">
        <PlatformHeader title="Onboarding" :canNavigateSettings="false" />

        <SkipLayout :buttonLabel="_L('next')" @button="forward" :skipLabel="_L('noStationTryAgain')" @skip="tryAgain" :scrollable="true">
            <Label class="title m-t-20 m-b-10 text-center" :text="_L('selectYourStation')" textWrap="true" />

            <Label class="instruction" :text="_L('selectStationInstruction')" lineHeight="4" textWrap="true" />

            <!-- Why is this here? -->
            <StackLayout class="m-t-10" />

            <GridLayout rows="auto" columns="30,*" class="option-container" v-for="station in nearbyStations" :key="station.id">
                <CheckBox
                    col="0"
                    :checked="station.selected"
                    :isEnabled="!station.selected"
                    fillColor="#2C3E50"
                    onCheckColor="#2C3E50"
                    onTintColor="#2C3E50"
                    fontSize="18"
                    boxType="circle"
                    @checkedChange="$event.value !== station.selected && onCheckChange(station.id)"
                />
                <Label col="1" class="m-t-5 m-l-5" :text="station.name" />
            </GridLayout>
        </SkipLayout>
    </Page>
</template>

<script lang="ts">
import Vue from "vue";
import SharedComponents from "@/components/shared";
import { routes } from "@/routes";

interface NearbyStation {
    id: number;
    selected: boolean;
    name: string;
}

export default Vue.extend({
    components: {
        ...SharedComponents,
    },
    props: {
        reconnecting: {
            type: Boolean,
            default: false,
        },
    },
    data(): {
        selectedStationId: number | null;
        visible: boolean;
    } {
        return {
            selectedStationId: null,
            visible: false,
        };
    },
    computed: {
        nearbyStations(): NearbyStation[] {
            const legacyStations = this.$s.getters.legacyStations;
            return Object.values(legacyStations)
                .filter((station) => station.connected)
                .map((station) => {
                    return {
                        id: station.id,
                        selected: station.id == this.selectedStationId,
                        name: station.name,
                    };
                });
        },
    },
    async mounted(): Promise<void> {
        const legacyStations = this.$s.getters.legacyStations;
        const connected = Object.values(legacyStations).filter((ls) => ls.connected);
        if (connected.length == 0) {
            await this.$navigateTo(routes.onboarding.searching, {
                props: {
                    reconnecting: this.reconnecting,
                },
            });
            return;
        }

        this.selectedStationId = connected[0].id;
        this.visible = true;
    },
    methods: {
        async tryAgain(): Promise<void> {
            await this.$navigateTo(routes.onboarding.searching, {});
        },
        async forward(): Promise<void> {
            if (this.reconnecting) {
                await this.$navigateTo(routes.onboarding.deploymentLocation, {
                    props: {
                        stationId: this.selectedStationId,
                    },
                });
            } else {
                await this.$navigateTo(routes.onboarding.rename, {
                    props: {
                        stationId: this.selectedStationId,
                    },
                });
            }
        },
        onCheckChange(id: number): void {
            this.selectedStationId = id;
        },
        onNavigatingFrom(): void {
            console.log("nearby-stations: navigating-from");
            this.visible = false;
        },
    },
    watch: {
        async nearbyStations(newValue: NearbyStation[], oldValue: NearbyStation[]) {
            if (newValue.length === 0) {
                console.log("no-nearby-stations", this.visible);
                if (this.visible) {
                    await this.$navigateTo(routes.onboarding.searchFailed, {
                        props: {
                            reconnecting: this.reconnecting,
                        },
                    });
                }
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.instruction {
    color: $fk-primary-black;
    text-align: center;
    font-size: 16;
    margin-top: 5;
    margin-bottom: 10;
    margin-right: 30;
    margin-left: 30;
}
.option-container {
    margin-top: 30;
    margin-left: 30;
    margin-right: 30;
}
</style>
