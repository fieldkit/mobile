<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <StackLayout row="0">
                <Label class="h2 m-y-20 text-center" :text="message" textWrap="true"></Label>
                <SynchronizePanel :station="station" />
            </StackLayout>

            <StationFooterTabs row="1" :station="station" active="data" />
        </GridLayout>
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
