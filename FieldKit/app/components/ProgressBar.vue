<template>
<StackLayout class="progress-bar-container" @loaded="onLoaded">
    <Label class="plain m-20 text-center" text="Hello, World" textWrap="true"></Label>
    <StackLayout row="0" horizontalAlignment="left" :style="styling" class="progress-bar"></StackLayout>
</StackLayout>
</template>

<script>
import Services from '../services/services';

export default {
    data() {
        return {
            value: 45,
        };
    },

    computed: {
        styling: function() {
            return {
                width: this.value + "%",
            };
        }
    },

    methods: {
        onLoaded(args) {
            // TODO Cancel subscription?
            console.log(Services.ProgressService());
            Services.ProgressService().subscribe((data) => {
                console.log(data);
            });
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
    width: 100%;
}

.progress-bar {
    background: $fk-secondary-blue;
    height: 20px;
}

</style>
