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

<script>
import { mapState, mapGetters } from "vuex";
import routes from "../../routes";

export default {
    props: {},
    data() {
        return {
            left: false,
            failed: false,
        };
    },
    computed: {
        ...mapGetters({ numberOfNearbyStations: "numberOfNearbyStations" }),
    },
    watch: {
        numberOfNearbyStations(newValue, oldValue) {
            return this.foundStations(newValue);
        },
    },
    methods: {
        onPageLoaded(args) {
            if (this.$store.getters.numberOfNearbyStations) {
                return this.foundStations(this.$store.getters.numberOfNearbyStations);
            }

            return Promise.delay(5000).then(() => {
                return this.$navigateTo(routes.onboarding.searchFailed);
            });
        },
        onNavigatingTo() {
            this.left = true;
        },
        foundStations(number) {
            console.log("nearby", number);
            if (number == 1) {
                if (true) {
                    return this.$navigateTo(routes.onboarding.nearby);
                }

                const connected = Object.values(this.$store.getters.legacyStations).filter(ls => ls.connected);
                if (connected.length < 1) {
                    throw new Error("expected a connected station");
                }

                return this.$navigateTo(routes.onboarding.network, {
                    props: {
                        stationId: connected[0].id,
                    },
                });
            }
            if (number > 1) {
                return this.$navigateTo(routes.onboarding.nearby);
            }
        },
    },
};
</script>

<style scoped lang="scss">
@import "../../app-variables";

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
