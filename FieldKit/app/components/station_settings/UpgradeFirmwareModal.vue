<template>
    <Page @loaded="onLoaded" @unloaded="onUnloaded">
        <GridLayout rows="auto, *" class="container">
            <StackLayout verticalAlign="center" class="bar-container" v-if="!done">
                <Label text="Upgrading station firmware. Thank you for your patience." textWrap="true" v-if="!downloadOnly && !error" />
                <Label text="No local firmware and you're offline so none can be downloaded." textWrap="true" v-if="error" />
                <Label text="Downloading firmware." textWrap="true" v-if="downloadOnly" />
                <Progress :value="progress" scaleY="4" v-if="!error" />
            </StackLayout>

            <StackLayout verticalAlign="center" class="bar-container" v-if="done">
                <Label text="Upgrade done, your station is now restarting." textWrap="true" v-if="!downloadOnly" />
                <Label text="Downloaded." textWrap="true" v-if="downloadOnly" />
                <Button @tap="close">OK</Button>
            </StackLayout>
        </GridLayout>
    </Page>
</template>
<script>
import { serializePromiseChain, promiseAfter } from "../../utilities";
import Services from "../../services/services";

export default {
    data() {
        return {
            progress: 0,
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
        onLoaded() {
            const updateProgress = progress => {
                this.progress = progress.progress;
            };

            if (this.downloadOnly) {
                console.log("downloading only");
                return Services.StationFirmware()
                    .downloadFirmware(updateProgress, true)
                    .then(() => {
                        this.done = true;
                    })
                    .catch(err => {
                        this.done = true;
                        console.log("error", err, err.stack);
                    });
            }

            console.log("checking for firmware");
            return Services.StationFirmware()
                .haveFirmware()
                .then(yes => {
                    console.log("firmware check", yes);

                    if (!yes) {
                        console.log("no firmware");
                        this.error = true;
                        return { error: true };
                    }

                    console.log("upgrading firmware");
                    return Services.StationFirmware()
                        .upgradeStation(this.station.url, updateProgress)
                        .then(() => {
                            this.done = true;
                        })
                        .catch(err => {
                            this.done = true;
                            console.log("error", err, err.stack);
                        });
                });
        },
        onUnloaded() {
            console.log("onUnloaded");
        },
        close() {
            console.log("Close");
            this.$modal.close(true);
        },
    },
};
</script>
<style scoped lang="scss">
@import "../../app-variables";

.container {
    height: 20%;
}

.bar-container {
    margin: 20;
}
</style>
