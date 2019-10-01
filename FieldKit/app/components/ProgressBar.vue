<template>
    <StackLayout id="progress-container">
        <Label class="plain m-20 text-center" :text="message" textWrap="true"></Label>
       <GridLayout
            rows="auto, auto, auto"
            columns="*"
            v-show="visible"
            class="progress-bar-container"
            @loaded="onLoaded">

            <StackLayout row="0" class="progress-bar"></StackLayout>
            <StackLayout row="0"
                :style="styling"
                class="progress-bar"
                horizontalAlignment="left"
                id="transfer-progress-bar"></StackLayout>

            <Label row="1"
                class="m-t-5 size-12"
                horizontalAlignment="right"
                :text="percentTransferred"></Label>
            <Label row="2"
                class="m-t-5 size-12"
                horizontalAlignment="right"
                :text="sizeTransferred"></Label>
        </GridLayout>
        <FlexboxLayout justifyContent="center">
            <Label :text="transferComplete"></Label>
        </FlexboxLayout>
    </StackLayout>
</template>

<script>
import Services from '../services/services';
import Config from '../config';

const log = Config.logger('ProgressBar');

export default {
    data() {
        return {
            message: null,
            progress: 0,
            visible: false,
            percentTransferred: 0,
            sizeTransferred: 0,
            transferComplete: ""
        };
    },

    computed: {
        styling: function() {
            return {
                width: this.progress + "%",
            };
        },
    },

    methods: {
        onLoaded(args) {
            // TODO Cancel subscription?
            Services.ProgressService().subscribe((data) => {
                if(data.message == "complete") { this.complete(data); return }
                this.progress = data.progress;
                this.message = data.message;
                // only show progress for data. meta will always be fast, and two bars is confusing
                this.visible = data.message != null && this.message.length > 0 && data.type != "meta";
                if(data.totalSize && data.currentSize) {
                    if(data.totalSize < 1000000.0) {
                        this.sizeTransferred = (data.currentSize / 1024.0).toFixed(2) + " KB";
                    } else {
                        this.sizeTransferred = (data.currentSize / 1048576.0).toFixed(2) + " MB";
                    }
                }
                this.percentTransferred = data.progress+"%";
                if(data.message != null) {
                    this.transferComplete = "";
                }
            });
        },

        complete(data) {
            if(data.type == "meta") { return }
            this.message = "";
            let completeMessage = this.sizeTransferred == 0 ? "File" : this.sizeTransferred;
            this.transferComplete = completeMessage + ' ' + _L('transferred');
            this.percentTransferred = 0;
            this.sizeTransferred = 0;
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

.progress-bar-container {
    width: 75%;
    margin-top: 20;
    margin-bottom: 20;
    margin-left: 10;
    margin-right: 10;
}

.progress-bar {
    height: 8;
    background: $fk-gray-lightest;
    border-radius: 4;
}

#transfer-progress-bar {
    background: $fk-secondary-blue;
}

</style>
