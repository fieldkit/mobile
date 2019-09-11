<template>
<StackLayout class="progress-bar-container" @loaded="onLoaded" v-show="visible">
    <Label class="plain m-20 text-center" :text="message" textWrap="true"></Label>
    <StackLayout row="0" horizontalAlignment="left" :style="styling" class="progress-bar"></StackLayout>
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
                this.progress = data.progress;
                this.message = data.message;
                this.visible = data.message != null && this.message.length > 0;
            });
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

.progress-bar-container {
    width: 100%;
}

.progress-bar {
    background: $fk-secondary-blue;
    height: 20px;
}

</style>
