<template>
    <StackLayout backgroundColor="white">
        <StationsMap
            id="stations-modal-map"
            :mappedStations="mappedStations"
            :height="height"
            @toggle-modal="onClose"
            @opened-details="onOpenedDetails"
        />
    </StackLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { mapGetters } from "vuex";
import StationsMap from "./StationsMap.vue";
import { Screen } from "@nativescript/core";
import { debug } from "@/lib";

export default Vue.extend({
    name: "MapModal",
    components: {
        StationsMap,
    },
    data(): { height: number } {
        return {
            // ios: isIOS,
            height: Screen.mainScreen.heightDIPs - 20,
        };
    },
    props: {},
    computed: {
        ...mapGetters({ mappedStations: "mappedStations" }),
    },
    mounted(): void {
        debug.log("map-modal: mounted");
    },
    methods: {
        onClose(): void {
            if (this.$modal) {
                debug.log("onClose");
                this.$modal.close();
            }
        },
        onOpenedDetails(): void {
            if (this.$modal) {
                debug.log("onOpenedDetails");
                this.$modal.close();
            }
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.ios-container {
    margin-bottom: 60;
    margin-right: 10;
}
.toggle-container {
    margin-bottom: 25;
    margin-right: 10;
}
</style>
