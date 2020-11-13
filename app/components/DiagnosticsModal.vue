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

export default Vue.extend({
    data() {
        return {
            progress: null,
            phrase: null,
            error: false,
            done: false,
        };
    },
    props: {},
    methods: {
        update(this: any, progress) {
            this.progress = progress;
            console.log("diagnostics", progress.id, progress.message);
        },
        onLoaded(this: any) {
            console.log("diagnostics loaded");

            return this.$services
                .Diagnostics()
                .upload((progress) => {
                    this.update(progress);
                })
                .then(
                    (res) => {
                        console.log("diagnostics done", res);
                        this.done = true;
                        this.phrase = res.reference.phrase;
                    },
                    (e) => {
                        console.log("diagnostics done", e);
                        this.done = true;
                        this.error = true;
                    }
                );
        },
        onUnloaded(this: any) {
            console.log("diagnostics unloaded");
        },
        close(this: any) {
            console.log("Close");
            this.$modal.close(true);
        },
    },
});
</script>
<style scoped lang="scss">
@import "~/_app-variables";

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
