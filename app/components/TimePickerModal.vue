<template>
    <StackLayout class="modal-bkgd" @shownModally="onShownModally">
        <GridLayout rows="250,55" columns="*,*" width="75%" class="picker-container text-center">
            <TimePicker row="0" colSpan="2" v-model="displayTime" />
            <Label
                row="1"
                col="0"
                :text="_L('cancel')"
                class="bottom-row left-cell p-y-20"
                verticalAlignment="middle"
                @tap="$modal.close()"
            />
            <Label row="1" col="1" class="bottom-row p-y-20" verticalAlignment="middle" :text="_L('ok')" @tap="onSubmit" />
        </GridLayout>
    </StackLayout>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    data(): { displayTime: string } {
        return {
            displayTime: "",
        };
    },
	props: {
		selectedTime: {
			type: String
		}
	}
    methods: {
        onShownModally(): void {
            this.displayTime = this.selectedTime;
        },
        onSubmit(): void {
            if (this.$modal) {
            this.$modal.close(this.displayTime);
            }
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
    margin-top: 25%;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}

.bottom-row {
    border-color: $fk-gray-lighter;
    border-top-width: 1;
}
.left-cell {
    border-right-width: 1;
}
</style>
