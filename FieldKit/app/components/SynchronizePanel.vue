<template>
<StackLayout class="sync-panel-container" @loaded="onLoaded" v-show="visible">
    <Label class="plain m-20 text-center" text="Sync Panel" textWrap="true"></Label>
</StackLayout>
</template>

<script>
import ProgressBar from './ProgressBar';

import Services from '../services/services';

export default {
    data() {
        return {
            visible: true,
        };
    },

    components: {
        ProgressBar
    },

    computed: {
        styling: function() {
            return {
            };
        },
    },

    methods: {
        onLoaded(args) {
        },
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables
// Custom styles

.sync-bar-container {
    width: 100%;
}

</style>
