<template>
    <StackLayout backgroundColor="white">
        <StationsMap
            id="stations-modal-map"
            :mappedStations="mappedStations"
            :allowModal="false"
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

export default Vue.extend({
    name: "MapModal",
    components: {
        StationsMap,
    },
    data() {
        return {
            // ios: isIOS,
            height: Screen.mainScreen.heightDIPs - 20,
        };
    },
    props: {},
    computed: {
        ...mapGetters({ mappedStations: "mappedStations" }),
    },
    methods: {
        onClose(this: any) {
            console.log("onClose");
            this.$modal.close();
        },
        onOpenedDetails(this: any) {
            console.log("onOpenedDetails");
            this.$modal.close();
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
