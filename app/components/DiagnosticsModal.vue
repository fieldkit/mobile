<template>
    <Page @loaded="onLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto, *" class="container">
            <StackLayout verticalAlign="center" class="bar-container">
                <Label :text="progress.message" textWrap="true" v-if="!done && progress" />

                <Label :text="_L('includeThisPhrase')" textWrap="true" v-if="phrase" />
                <Label :text="phrase" textWrap="true" class="phrase" v-if="phrase" />

                <Button @tap="close" v-if="done" class="btn btn-primary btn-padded">OK</Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script>
import { serializePromiseChain, promiseAfter } from "../utilities";
import Services from "../services/services";

export default {
    data() {
        return {
            progress: null,
            phrase: null,
            error: false,
            done: false,
        };
    },
    props: {
        station: {
            required: true,
            type: Object,
        },
        downloadOnly: {
            required: true,
            type: Boolean,
        },
    },
    methods: {
        update(progress) {
            this.progress = progress;
            console.log("diagnostics", progress.id, progress.message);
        },
        onLoaded() {
            console.log("diagnostics loaded");

            Services.Diagnostics()
                .upload(progress => {
                    this.update(progress);
                })
                .then(
                    res => {
                        console.log("diagnostics done");
                        this.done = true;
                        this.phrase = res.reference.phrase;
                    },
                    e => {
                        console.log("diagnostics done");
                        this.done = true;
                        this.error = true;
                    }
                );
        },
        onUnloaded() {
            console.log("diagnostics unloaded");
        },
        close() {
            console.log("Close");
            this.$modal.close(true);
        },
    },
};
</script>
<style scoped lang="scss">
@import "../app-variables";

.container {
    height: 30%;
}

.bar-container {
    margin: 20;
}

.phrase {
    font-weight: bold;
    font-size: 18;
}
</style>
