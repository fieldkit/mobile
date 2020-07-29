<template>
    <StackLayout class="modal-bkgd" @shownModally="onShownModally">
        <GridLayout rows="55,*" columns="*" width="100%" class="picker-container text-center">
            <StackLayout row="0" horizontalAlignment="right" class="m-r-20" @tap="$modal.close()">
                <Image width="21" src="~/images/Icon_Close.png" />
            </StackLayout>
            <StackLayout row="1">
                <Label :text="_L('tapStationToRecalibrate')" textWrap="true" class="m-20 size-20" />
                <StackLayout
                    v-for="(s, index) in stations"
                    :key="s.sortedIndex"
                    :id="'station-' + s.id"
                    class="station-container m-20 p-10"
                    orientation="vertical"
                    @tap="selectStation"
                >
                    <Label :text="s.name" class="station-name" />
                </StackLayout>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    data() {
        return {};
    },
    props: ["stations"],
    methods: {
        onShownModally(this: any, args) {},
        selectStation(this: any, event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            // remove the "station-" prefix
            let id = event.object.id.split("station-")[1];
            const station = this.stations.find((s) => {
                return s.id == id;
            });
            this.$modal.close(station);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.modal-bkgd {
    background-color: gray;
}
.picker-container {
    background-color: white;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}
.station-container {
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}
.station-name {
    font-size: 18;
    color: $fk-primary-black;
}

.bottom-row {
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.left-cell {
    border-right-width: 1;
}
</style>
