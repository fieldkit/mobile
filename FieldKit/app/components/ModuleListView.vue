<template>
    <StackLayout id="module-list-container" class="m-10">
        <GridLayout
            rows="auto"
            columns="*"
            v-for="(m, moduleIndex) in modules"
            :key="m.id"
        >
            <StackLayout class="bordered-container p-10 m-y-10">
                <!-- top row of module list -->
                <GridLayout rows="auto" columns="15*,70*,15*">
                    <!-- module icon -->
                    <Image
                        row="0"
                        col="0"
                        width="40"
                        horizontalAlignment="left"
                        :src="
                            m.name.indexOf('Water') > -1
                                ? '~/images/Icon_Water_Module.png'
                                : m.name.indexOf('Weather') > -1
                                ? '~/images/Icon_Weather_Module.png'
                                : '~/images/Icon_Generic_Module.png'
                        "
                    ></Image>
                    <!-- module name -->
                    <Label
                        row="0"
                        col="1"
                        :text="m.name"
                        class="module-name"
                        textWrap="true"
                    />
                    <!-- toggle sensor container -->
                    <Image
                        row="0"
                        col="2"
                        verticalAlignment="center"
                        horizontalAlignment="right"
                        :src="open.indexOf(m.id) > -1
                            ? '~/images/Icon_Cheveron_Up.png'
                            : '~/images/Icon_Cheveron_Down.png'"
                        width="25"
                        :dataId="'m_id-' + m.id"
                        @tap="toggleContainer"
                    ></Image>
                </GridLayout>
                <!-- sensor container -->
                <WrapLayout
                    orientation="horizontal"
                    v-if="open.indexOf(m.id) > -1"
                >
                    <WrapLayout
                        orientation="horizontal"
                        v-for="(s, sensorIndex) in m.sensorObjects"
                        :key="s.id"
                        class="sensor-block"
                    >
                        <!-- keep arrows, reading, and unit on same line -->
                        <FlexboxLayout>
                            <!-- trend arrow -->
                            <Image
                                width="7"
                                verticalAlignment="bottom"
                                :src="s.icon"
                                class="trend-icon"
                            ></Image>
                            <!-- reading -->
                            <Label
                                flexShrink="0.25"
                                :text="s.displayReading"
                                verticalAlignment="bottom"
                                class="size-24 m-l-2"
                            />
                            <!-- unit -->
                            <Label
                                :text="s.unit"
                                verticalAlignment="bottom"
                                class="unit size-12 m-t-10"
                            />
                        </FlexboxLayout>
                        <!-- name -->
                        <Label
                            :text="s.name"
                            textWrap="true"
                            class="sensor-name size-14"
                        />
                    </WrapLayout>
                    <!-- view graph link -->
                    <!-- <StackLayout class="link-container text-center">
                        <Label
                            text="View Graph"
                            :id="'m_id-' + m.id"
                            class="view-graph-link text-center"
                            :automationText="'moduleLink' + moduleIndex"
                            @tap="emitModuleTapped"
                        />
                    </StackLayout> -->
                </WrapLayout>
            </StackLayout>
        </GridLayout>
    </StackLayout>
</template>

<script>
import Services from "../services/services";
const dbInterface = Services.Database();

export default {
    name: "ModuleListView",
    data: () => {
        return {
            open: [],
            modules: []
        };
    },
    props: [],
    methods: {
        updateModules(modules) {
            this.modules = modules;
            this.modules.forEach(m => {
                this.open.push(m.id);
                m.sensorObjects.forEach(s => {
                    s.displayReading = s.currentReading
                        ? s.currentReading.toFixed(1)
                        : "--";
                    s.icon = "~/images/Icon_Neutral.png";
                });
            });
        },

        updateReadings(liveReadings) {
            this.modules.forEach(m => {
                let sensors = [];
                m.sensorObjects.forEach(s => {
                    if (liveReadings && liveReadings[m.name + s.name]) {
                        let prevReading = s.currentReading
                            ? +s.currentReading.toFixed(1)
                            : 0;
                        let newReading = +liveReadings[m.name + s.name].toFixed(
                            1
                        );
                        s.currentReading = newReading;
                        s.displayReading = newReading;
                        dbInterface.setCurrentReading(s);

                        let trendIcon = "Icon_Neutral.png";
                        if (newReading < prevReading) {
                            trendIcon = "Icon_Decrease.png";
                        } else if (newReading > prevReading) {
                            trendIcon = "Icon_Increase.png";
                        }
                        s.icon = "~/images/" + trendIcon;
                        sensors.push(s);
                    }
                });
                // vue isn't rendering these dynamically, so set them
                this.$set(m, "sensorObjects", sensors);
            });
        },

        emitModuleTapped(event) {
            this.$emit("moduleTapped", event);
        },

        toggleContainer(event) {
            let id = event.object.dataId.split("m_id-")[1];
            id = parseInt(id);
            let index = this.open.indexOf(id);
            if (index == -1) {
                this.open.push(id);
            } else {
                this.open.splice(index, 1);
            }
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.bordered-container {
    border-radius: 4;
    border-color: $fk-gray-lighter;
    border-width: 1;
}

.module-name {
    font-size: 18;
    margin-top: 8;
}

.sensor-block {
    width: 46%;
    padding: 10;
    margin: 5 2%;
    background: $fk-gray-lightest;
}

.trend-icon {
    margin-bottom: 6;
}

.unit {
    margin-left: 2;
    margin-bottom: 3;
}

.sensor-name {
    width: 100%;
    margin-top: 5;
    font-family: "Avenir LT Pro", "AvenirLTPro-Book";
}

.link-container {
    width: 100%;
}

.view-graph-link {
    width: 125;
    padding: 5;
    margin: 5;
    text-decoration: underline;
}
</style>
