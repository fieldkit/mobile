<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout
                flexDirection="column"
                class="p-t-10"
            >
                <ScreenHeader
                    :title="viewTitle"
                    :subtitle="stationName"
                    :onBack="goBack"
                    :canNavigateSettings="false"
                />

                <StackLayout class="m-x-20">
                    <StackLayout class="m-b-20">
                        <Label text="Field Notes" class="size-18 m-b-10"></Label>
                        <Label
                            text="Provide details about your station location and objective."
                            textWrap="true"
                            class="size-12"
                        ></Label>
                    </StackLayout>
                    <StackLayout class="note-section">
                        <Label text="Study Objective" class="size-16 m-b-5"></Label>
                        <Label :text="objective" class="size-12 m-b-10"></Label>
                    </StackLayout>
                    <StackLayout class="note-section">
                        <Label text="Purpose of Site Location" class="size-16 m-b-5"></Label>
                        <Label :text="locationPurpose" class="size-12 m-b-10"></Label>
                    </StackLayout>
                    <StackLayout class="note-section">
                        <Label text="Site Criteria" class="size-16 m-b-5"></Label>
                        <Label :text="criteria" class="size-12 m-b-10"></Label>
                    </StackLayout>
                    <StackLayout class="note-section">
                        <Label text="Site Description" class="size-16 m-b-5"></Label>
                        <Label :text="description" class="size-12 m-b-10"></Label>
                    </StackLayout>

                    <StackLayout class="m-t-20">
                        <Label text="Photos (required)" class="size-12 m-b-10"></Label>
                        <StackLayout class="photo-btn" horizontalAlignment="left">
                            <Image
                                src="~/images/add.png"
                                width="20"
                                opacity="0.25"
                                class="photo-btn-img"
                            />
                        </StackLayout>
                    </StackLayout>

                    <StackLayout class="m-t-30">
                        <Label text="Additional Notes" class="size-12 m-b-10"></Label>
                    </StackLayout>

                    <FlexboxLayout justifyContent="center" class="m-t-20 m-b-20">
                        <Image src="~/images/add.png" width="20" />
                        <Label text="Add Note" class="p-l-5"></Label>
                    </FlexboxLayout>

                    <Button
                        class="btn btn-primary m-b-10"
                        text="Continue"
                        automationText="nextButton"
                    ></Button>
                </StackLayout>
                <TextView id="hidden-field" />
            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
import ScreenHeader from "./ScreenHeader";
import Services from "../services/services";
import routes from "../routes";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

export default {
    data() {
        return {
            viewTitle: _L("deployment"),
            stationName: "",
            objective: "Click to add your study objective",
            locationPurpose: "Click to add the purpose of your site location",
            criteria: "Click to add your site criteria",
            description: "Click to add your site description"
        };
    },
    props: ["station"],
    components: {
        ScreenHeader
    },
    methods: {
        goBack(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            this.$navigateTo(routes.deployMap, {
                props: {
                    station: this.station
                }
            });
        },

        onPageLoaded(args) {
            this.page = args.object;

            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            dbInterface
                .getFieldNotes(this.station.id)
                .then(this.getFieldMedia)
                .then(this.setup);
        },

        getFieldMedia(notes) {
            this.fieldNotes = notes;
            return dbInterface.getFieldMedia(this.station.id);
        },

        setup(media) {
            this.fieldMedia = media;

            this.stationName = this.station.name;
            if (this.station.studyObjective) {
                this.objective = this.station.studyObjective;
            }
            if (this.station.locationPurpose) {
                this.locationPurpose = this.station.locationPurpose;
            }
            if (this.station.siteCriteria) {
                this.criteria = this.station.siteCriteria;
            }
            if (this.station.siteDescription) {
                this.description = this.station.siteDescription;
            }

            this.fieldNotes.forEach(note => {
                // add additional notes
            });

            this.fieldMedia.forEach(img => {
                // display images
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

.small-round {
    width: 40;
    padding: 2;
    border-radius: 20;
}

.note-section {
    border-bottom-width: 1;
    border-color: $fk-gray-lighter;
    margin-top: 10;
    margin-bottom: 10;
}

.photo-btn {
    width: 100;
    height: 100;
    background-color: $fk-gray-lightest;
}
.photo-btn-img {
    margin-top: 40;
}

#hidden-field {
    opacity: 0;
}
</style>
