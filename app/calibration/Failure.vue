<template>
    <GridLayout rows="auto, *, auto" verticalAlignment="stretch">
        <StackLayout row="0">
            <Image src="~/images/Icon_Warning_error.png" class="small"></Image>
            <Label :text="_L('calibrationFailed')" class="instruction-heading"></Label>
        </StackLayout>

        <ScrollView row="1" class="information-container">
            <StackLayout>
                <Label :text="_L('calibrationErrorOccured')" class="instruction" textWrap="true" />
                <GridLayout rows="auto,auto,auto,auto" columns="*,*" class="table" v-if="rows.length >= 3">
                    <Label row="0" col="0" text="Expected" class="column-heading" />
                    <Label row="0" col="1" text="Measured" class="column-heading" />

                    <Label row="1" col="0" :text="rows[0].expected | prettyReading" class="column-value" />
                    <Label row="1" col="1" :text="rows[0].measured | prettyReading" class="column-value" />
                    <Label row="2" col="0" :text="rows[1].expected | prettyReading" class="column-value" />
                    <Label row="2" col="1" :text="rows[1].measured | prettyReading" class="column-value" />
                    <Label row="3" col="0" :text="rows[2].expected | prettyReading" class="column-value" />
                    <Label row="3" col="1" :text="rows[2].measured | prettyReading" class="column-value" />
                </GridLayout>
            </StackLayout>
        </ScrollView>

        <StackLayout row="2">
            <Button class="btn btn-primary" :text="_L('calibration.failure.again')" @tap="tryAgain" />
            <Label :text="_L('calibration.failure.later')" class="skip" textWrap="true" @tap="skip" />
        </StackLayout>
    </GridLayout>
</template>

<script lang="ts">
import Vue from "vue";
import { debug } from "@/lib";

export default Vue.extend({
    name: "Failure",
    props: {
        moduleId: {
            type: String,
            required: true,
        },
    },
    data(): {
        rows: { expected: number; measured: number }[];
    } {
        return {
            rows: [],
        };
    },
    mounted() {
        const cal = this.$store.state.cal.pending[this.moduleId];
        if (cal) {
            this.rows = cal.points.map((p) => {
                return {
                    expected: p.references[0],
                    measured: p.factory[0],
                };
            });
        } else {
            debug.log("calibration data missing");
        }
    },
    methods: {
        tryAgain(): void {
            this.$emit("try-again");
        },
        skip(): void {
            this.$emit("skip");
        },
    },
});
</script>

<style scoped lang="scss">
@import "~/_app-variables";

.skip {
    padding-top: 10;
    padding-bottom: 10;
    font-size: 14;
    font-weight: bold;
    text-align: center;
    margin: 10;
}

.instruction-heading {
    color: $fk-primary-black;
    text-align: center;
    margin-right: 20;
    margin-left: 20;
    font-size: 18;
    font-weight: bold;
}

.small {
    width: 50;
    margin: 20;
}

.btn-primary {
    margin-bottom: 0;
}

.information-container {
    margin: 30 15 15;
    line-height: 4;
    color: $fk-primary-black;
}

.table {
    padding-top: 20;
}

.column-heading {
    font-weight: bold;
    padding: 10;
}

.column-value {
    font-weight: bold;
    padding: 10;
}
</style>
