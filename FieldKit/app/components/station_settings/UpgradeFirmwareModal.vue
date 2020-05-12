<template>
    <StackLayout class="modal-bkgd" @loaded="onLoaded" @unloaded="onUnloaded">
        <GridLayout rows="*" columns="*" width="100%" height="100%" class="p-20 modal-container text-center">
            <StackLayout verticalAlignment="middle" class="bar-container" v-if="!done">
                <Label
                    class="info"
                    lineHeight="4"
                    text="Upgrading station firmware. Thank you for your patience."
                    textWrap="true"
                    v-if="!downloadOnly && !error"
                />
                <Label
                    class="info"
                    lineHeight="4"
                    text="No local firmware and you're offline so none can be downloaded."
                    textWrap="true"
                    v-if="error"
                />
                <Label class="info" lineHeight="4" text="Downloading firmware." textWrap="true" v-if="downloadOnly" />
                <Progress :value="progress" scaleY="4" v-if="!error" />
            </StackLayout>

            <StackLayout verticalAlignment="middle" class="bar-container" v-if="done">
                <Label
                    class="info"
                    lineHeight="4"
                    text="Upgrade done, your station is now restarting."
                    textWrap="true"
                    v-if="!downloadOnly"
                />
                <Label class="info" lineHeight="4" text="Downloaded." textWrap="true" v-if="downloadOnly" />
                <Label class="ok-btn" text="OK" verticalAlignment="middle" @tap="$modal.close()" />
            </StackLayout>
        </GridLayout>
    </StackLayout>
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
    },
};
</script>
<style scoped lang="scss">
@import "../../app-variables";

.modal-bkgd {
    background-color: gray;
}
.modal-container {
    background-color: white;
    border-color: $fk-gray-lighter;
    border-width: 1;
    border-radius: 4;
}
.info {
    color: $fk-primary-black;
    margin: 20;
}
.ok-btn {
    color: $fk-primary-red;
    font-weight: bold;
}
.bar-container {
    margin: 20;
}
</style>
