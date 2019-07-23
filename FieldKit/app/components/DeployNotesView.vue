<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <StackLayout>
                <GridLayout rows="auto" columns="10*,90*">
                    <StackLayout col="0" class="round" verticalAlignment="top" @tap="goBack">
                        <Image
                            width="21"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <StackLayout col="1" class="title-container m-t-10 m-r-30">
                        <Label
                            class="bold text-center"
                            :text="viewTitle"
                            textWrap="true"></Label>
                        <Label
                            class="bold m-b-10 text-center"
                            :text="station.name"
                            textWrap="true"></Label>
                    </StackLayout>
                </GridLayout>

                <GridLayout rows="auto" columns="*">
                    <StackLayout
                        row="0"
                        class="col left-col"
                        horizontalAlignment="left">
                        <Label class="text-center m-y-5 size-18" text="Audio Notes"></Label>
                    </StackLayout>
                    <StackLayout
                        row="0"
                        class="col right-col"
                        horizontalAlignment="right"
                        @tap="onPhotoTap">
                        <Label class="text-center m-y-5 size-18" text="Photo"></Label>
                    </StackLayout>
                </GridLayout>

                <Label text="Tap to write field notes and add a photo. It is important to describe what you see in the field to help your team." textWrap="true" class="m-15 size-18" />

                <GridLayout rows="*, auto" columns="8*,84*,8*" v-show="havePhoto" class="m-10 photo-label">
                    <Image row="0" colSpan="3" :src="imageSrc" id="image" stretch="aspectFit" />
                    <Image
                        row="1"
                        col="0"
                        class="m-10"
                        width="17"
                        v-show="isEditingLabel"
                        @tap="cancelEditLabel"
                        src="~/images/Icon_Close.png"></Image>
                    <TextView row="1"
                        col="1"
                        hint="Describe this photo..."
                        id="photo-label-input"
                        @focus="toggleLabelEdit"
                        v-model="labelText"
                        horizontalAlignment="left"></TextView>
                    <Image
                        row="1"
                        col="2"
                        class="m-10"
                        width="17"
                        horizontalAlignment="right"
                        v-show="isEditingLabel"
                        @tap="saveLabel"
                        src="~/images/Icon_Save.png"></Image>
                </GridLayout>

                <TextView hint="Should be hidden" id="hidden-field" />

            </StackLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import { Folder, path, knownFolders } from "tns-core-modules/file-system";
    import { ImageSource, fromFile } from "tns-core-modules/image-source";
    import { takePicture, requestPermissions } from "nativescript-camera";
    import * as imagepicker from "nativescript-imagepicker";
    import * as dialogs from "tns-core-modules/ui/dialogs";
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";

    const dbInterface = new DatabaseInterface();
    const documents = knownFolders.documents();
    const folder = documents.getFolder("FieldKitImages");
    const source = new ImageSource();

    export default {
        data() {
            return {
                viewTitle: "Deployment",
                station: {
                    name: "FieldKit Station",
                },
                saveToGallery: true,
                allowsEditing: true,
                keepAspectRatio: true,
                width: 640,
                height: 360,
                imageSrc: null,
                labelText: "",
                origLabel: "",
                havePhoto: false,
                pathDest: "",
                deployImageName: "",
                origImageName: "",
                isEditingLabel: false
            };
        },
        props: ['stationId'],
        methods: {
            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.deployMap, {
                    props: {
                        stationId: this.stationId
                    }
                });
            },

            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                dbInterface.getStation(this.stationId)
                    .then(this.completeSetup);
            },

            completeSetup(stations) {
                this.station = stations[0];
                this.deployImageName = this.station.device_id+"_deploy.jpg";
                this.origLabel = this.station.deploy_image_label;
                this.origImageName = this.station.deploy_image_name;
                this.pathDest = path.join(folder.path, this.deployImageName);
                if(this.origImageName && this.origImageName.length > 0) {
                    // load previously saved image
                    this.pathDest = path.join(folder.path, this.origImageName);
                    const imageFromLocalFile = fromFile(this.pathDest);
                    this.imageSrc = imageFromLocalFile;
                    this.labelText = this.origLabel;
                    this.havePhoto = true;
                }
            },

            onPhotoTap(event) {
                dialogs.action({
                    message: "Add a photo",
                    cancelButtonText: "Cancel",
                    actions: ["Take picture", "Select from gallery"]
                }).then(result => {
                    if(result == "Take picture") {
                        this.takePicture();
                    } else if(result == "Select from gallery"){
                        this.selectPicture();
                    }
                });
            },

            takePicture() {
                let notesView = this;
                requestPermissions().then(() => {
                    takePicture({
                        // width: notesView.width,
                        // height: notesView.height,
                        keepAspectRatio: notesView.keepAspectRatio,
                        saveToGallery: notesView.saveToGallery,
                        allowsEditing: notesView.allowsEditing
                    }).then(imageAsset => {
                            notesView.imageSrc = imageAsset;
                            notesView.savePicture();
                            notesView.havePhoto = true;
                        }, err => {
                            // console.log("Error -> " + err.message);
                        });
                    }, () => {
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
                        // selection[0].options.width = this.width;
                        // selection[0].options.height = this.height;
                    }).catch(e => {
                        // console.log(e);
                    });
            },

            savePicture() {
                source.fromAsset(this.imageSrc)
                    .then(imageSource => {
                        let saved = imageSource.saveToFile(this.pathDest, "jpg");
                        if (saved) {
                            this.station.deploy_image_name = this.deployImageName;
                            dbInterface.setStationDeployImage(this.station);
                            let configChange = {
                                station_id: this.station.device_id,
                                before: this.origLabel,
                                after: this.labelText,
                                affected_field: "deploy_image_label",
                                author: this.user.name
                            };
                            dbInterface.recordStationConfigChange(configChange);
                            this.origImageName = this.deployImageName;
                        }
                    }, error => {
                        // console.log("Error saving image", error);
                    });
            },

            saveLabel() {
                this.removeFocus();
                this.station.deploy_image_label = this.labelText;
                this.isEditingLabel = false;
                dbInterface.setStationDeployImageLabel(this.station);
                this.origLabel = this.labelText;
                let configChange = {
                    station_id: this.station.device_id,
                    before: this.origImageName,
                    after: this.deployImageName,
                    affected_field: "deploy_image_name",
                    author: this.user.name
                };
                dbInterface.recordStationConfigChange(configChange);
            },

            toggleLabelEdit() {
                this.isEditingLabel = true;
            },

            cancelEditLabel() {
                this.removeFocus();
                this.isEditingLabel = false;
                this.labelText = this.origLabel;
            },

            removeFocus() {
                let textField = this.page.getViewById("photo-label-input");
                textField.dismissSoftInput();

                let hiddenField = this.page.getViewById("hidden-field");
                hiddenField.focus();
                hiddenField.dismissSoftInput();
            }

        }

    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    .round {
        width: 40;
        padding-bottom: 10;
        padding-top: 8;
        margin-top: 1;
        border-radius: 20;
    }

    .col {
        width: 50%;
        border-width: 1;
        border-color: $fk-gray-lighter;
        background: $fk-gray-white;
        padding-top: 10;
        padding-bottom: 10;
    }

    .left-col {
        margin-left: 10;
        border-top-left-radius: 4;
        border-bottom-left-radius: 4;
    }

    .right-col {
        margin-right: 10;
        border-top-right-radius: 4;
        border-bottom-right-radius: 4;
    }

    .photo-label {
        width: 96%;
        padding: 0;
        font-size: 18;
    }

    #photo-label-input {
        width: 96%;
        border-bottom-width: 1;
        border-bottom-color: $fk-primary-black;
    }

    #hidden-field {
        opacity: 0;
    }

</style>