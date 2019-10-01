<template>
<Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
    <DockLayout height="100%" stretchLastChild="true">
        <Label class="h2 m-y-20 text-center" :text="message" textWrap="true" dock="top"></Label>

        <SynchronizePanel dock="top" :station="station" />

        <StackLayout dock="bottom" verticalAlignment="bottom">
            <StationFooterTabs :station="station" active="data" />
        </StackLayout>
    </DockLayout>
</Page>
</template>

<script>
import routes from "../routes";

import SynchronizePanel from './SynchronizePanel';
import StationFooterTabs from './StationFooterTabs';

export default {
    data() {
        return {
        };
    },
    components: {
        SynchronizePanel,
        StationFooterTabs,
    },
    props: ['station'],
    methods: {
        onPageLoaded(args) {
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import '../app-variables';
// End custom common variables

// Custom styles

</style>
