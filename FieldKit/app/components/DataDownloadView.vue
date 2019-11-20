<template>
    <Page class="page" actionBarHidden="true" @loaded="onPageLoaded">
        <GridLayout rows="*,80">
            <ScrollView row="0">
                <GridLayout rows="60,*">
                    <ScreenHeader
                        row="0"
                        class="p-t-10"
                        title="Data Sync"
                        :canNavigateBack="false"
                        :canNavigateSettings="false"
                    />
                    <SynchronizePanel row="1" />
                </GridLayout>
            </ScrollView>
            <StationFooterTabs row="1" active="data" />
        </GridLayout>
    </Page>
</template>

<script>
import routes from "../routes";
import SynchronizePanel from "./SynchronizePanel";
import StationFooterTabs from "./StationFooterTabs";
import ScreenHeader from "./ScreenHeader";

export default {
    components: {
        ScreenHeader,
        SynchronizePanel,
        StationFooterTabs
    },
    data() {
        return {};
    },
    methods: {
        onPageLoaded(args) {},
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
</style>
