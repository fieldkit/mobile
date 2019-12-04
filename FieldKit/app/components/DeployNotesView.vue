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
                        <WrapLayout orientation="horizontal">
                            <StackLayout
                                v-for="photo in photos"
                                :key="photo.id"
                                class="photo-display"
                            >
                                <Image
                                    :src="photo.src"
                                    stretch="aspectFit"
                                />
                            </StackLayout>
                            <StackLayout class="photo-btn" @tap="onPhotoTap">
                                <Image
                                    src="~/images/add.png"
                                    width="20"
                                    opacity="0.25"
                                    class="photo-btn-img"
                                />
                            </StackLayout>
                        </WrapLayout>
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
import { Folder, path, knownFolders } from "tns-core-modules/file-system";
import { ImageSource, fromFile } from "tns-core-modules/image-source";
import { takePicture, requestPermissions } from "nativescript-camera";
import * as imagepicker from "nativescript-imagepicker";
import * as dialogs from "tns-core-modules/ui/dialogs";
import ScreenHeader from "./ScreenHeader";
import Services from "../services/services";
import routes from "../routes";

const dbInterface = Services.Database();
const queryStation = Services.QueryStation();

const documents = knownFolders.documents();
const folder = documents.getFolder("FieldKitImages");
const source = new ImageSource();

export default {
    data() {
        return {
            viewTitle: _L("deployment"),
            stationName: "",
            objective: "Click to add your study objective",
            locationPurpose: "Click to add the purpose of your site location",
            criteria: "Click to add your site criteria",
            description: "Click to add your site description",
            photos: [],
            saveToGallery: true,
            allowsEditing: true,
            keepAspectRatio: true,
            imageSrc: null,
            havePhoto: false,
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

            this.photos = [];
            this.fieldMedia.forEach((img, i) => {
                // load previously saved images
                const dest = path.join(folder.path, img.imageName);
                const imageFromLocalFile = fromFile(dest);
                this.photos.push({
                    id: i,
                    src: imageFromLocalFile
                });
                this.havePhoto = true;
            });
        },

        onPhotoTap(event) {
            let cn = event.object.className;
            event.object.className = cn + " pressed";
            setTimeout(() => {
                event.object.className = cn;
            }, 500);

            dialogs
                .action({
                    message: _L("addPhoto"),
                    cancelButtonText: _L("cancel"),
                    actions: [_L("takePicture"), _L("selectFromGallery")]
                })
                .then(result => {
                    if (result == _L("takePicture")) {
                        this.takePicture();
                    } else if (result == _L("selectFromGallery")) {
                        this.selectPicture();
                    }
                });
        },

        takePicture() {
            requestPermissions().then(
                () => {
                    takePicture({
                        keepAspectRatio: this.keepAspectRatio,
                        saveToGallery: this.saveToGallery,
                        allowsEditing: this.allowsEditing
                    }).then(
                        imageAsset => {
                            this.imageSrc = imageAsset;
                            this.savePicture();
                            this.havePhoto = true;
                        },
                        err => {
                            // console.log("Error -> " + err.message);
                        }
                    );
                },
                () => {
                    // console.log('Camera permissions rejected');
                }
            );
        },

        selectPicture() {
            let context = imagepicker.create({
                mode: "single" // only one picture can be selected
            });
            context
                .authorize()
                .then(() => {
                    this.imageSrc = null;
                    return context.present();
                })
                .then(selection => {
                    this.imageSrc = selection[0];
                    this.savePicture();
                    this.havePhoto = true;
                })
                .catch(e => {
                    // console.log(e);
                });
        },

        savePicture() {
            const name = this.station.id + "_img_" + Date.now() + ".jpg";
            const dest = path.join(folder.path, name);
            let media = {
                stationId: this.station.id,
                imageName: name,
                imageLabel: "",
                category: "default",
                author: this.userName
            };
            dbInterface.insertFieldMedia(media);

            source.fromAsset(this.imageSrc).then(
                imageSource => {
                    let saved = imageSource.saveToFile(dest, "jpg");
                    if (saved) {
                        // send image to portal as field note media
                        let params = { stationId: this.station.id, pathDest: dest };
                        this.$portalInterface.addFieldNoteMedia(params).then(result => {
                            // console.log("result? ---->", result)
                        });
                    }
                },
                error => {
                    // console.log("Error saving image", error);
                }
            );
        },
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

.photo-display,
.photo-btn {
    width: 100;
    height: 100;
    margin: 20;
    background-color: $fk-gray-lightest;
}
.photo-btn-img {
    margin-top: 40;
}

#hidden-field {
    opacity: 0;
}
</style>
