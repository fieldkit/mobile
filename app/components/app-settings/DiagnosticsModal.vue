<template>
    <Page @loaded="onLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto, *" class="container">
            <StackLayout verticalAlign="center" class="bar-container">
                <Label :text="progress.message" textWrap="true" v-if="!done && progress" />
                <Progress :value="progress.progress * 100" scaleY="4" v-if="!done && progress && progress.progress" />

                <Label :text="_L('includeThisPhrase')" textWrap="true" v-if="phrase" />
                <Label :text="phrase" textWrap="true" class="phrase" v-if="phrase" />

                <Button @tap="close" v-if="done" class="btn btn-primary btn-padded">OK</Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script lang="ts">
import Vue from "vue";
import { DiagnosticsProgress } from "@/services/diagnostics-service";

export default Vue.extend({
    data(): {
        progress: DiagnosticsProgress | null;
        phrase: string | null;
        error: boolean;
        done: boolean;
    } {
        return {
            progress: null,
            phrase: null,
            error: false,
            done: false,
        };
    },
    methods: {
        update(progress: DiagnosticsProgress): void {
            this.progress = progress;
            console.log("diagnostics", progress.id, progress.message);
        },
        onLoaded(): void {
            console.log("diagnostics loaded");

            void this.$services
                .Diagnostics()
                .upload((progress) => {
                    this.update(progress);
                })
                .then(
                    (res) => {
                        console.log("diagnostics done", res);
                        this.done = true;
                        if (res) {
                            this.phrase = res.reference.phrase;
                        }
                    },
                    (e) => {
                        console.log("diagnostics done", e);
                        this.done = true;
                        this.error = true;
                    }
                );
        },
        onUnloaded(): void {
            console.log("diagnostics unloaded");
        },
        close(): void {
            console.log("Close");
            this.$modal.close(true);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

.container {
    height: 50%;
}

.bar-container {
    margin: 20;
}

.phrase {
    font-weight: bold;
    font-size: 18;
}
</style>
