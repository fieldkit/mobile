<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <StackLayout>
                    <ScreenHeader title="Data Sync" :canNavigateBack="false" :canNavigateSettings="false" />

                    <SynchronizePanel :station="station" />
                </StackLayout>
            </ScrollView>

            <StationFooterTabs row="1" :station="station" active="data" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";

import SynchronizePanel from "./SynchronizePanel";
import StationFooterTabs from "./StationFooterTabs";
import ScreenHeader from "./ScreenHeader";

export default {
    props: {
        station: Object
    },
    components: {
        ScreenHeader,
        SynchronizePanel,
        StationFooterTabs
    },
    data() {
        return {};
    },
    methods: {
        onPageLoaded(args) {}
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
</style>
