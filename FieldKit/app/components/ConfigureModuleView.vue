<template>
    <Page class="page plain" actionBarHidden="true" @loaded="onPageLoaded">
        <ScrollView>
            <FlexboxLayout flexDirection="column" justifyContent="space-between">
                <GridLayout rows="auto" columns="*">
                    <StackLayout row="0" class="round m-y-10" @tap="goBack" horizontalAlignment="left">
                        <Image
                            width="21"
                            class="m-t-10"
                            v-show="!isEditingName"
                            src="~/images/Icon_backarrow.png"></Image>
                    </StackLayout>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="left"
                        v-show="isEditingName"
                        @tap="cancelRename"
                        src="~/images/Icon_Close.png"></Image>
                    <Label
                        row="0"
                        class="title m-y-20 text-center module-name"
                        :text="module.name"
                        v-show="!isEditingName"
                        textWrap="true"></Label>
                    <!-- Edit name form -->
                    <StackLayout row="0" id="module-name-field" class="input-field m-y-20 text-left">
                        <FlexboxLayout>
                            <TextField
                                class="input"
                                :isEnabled="true"
                                keyboardType="name"
                                autocorrect="false"
                                autocapitalizationType="none"
                                horizontalAlignment="left"
                                v-model="module.name"
                                v-show="isEditingName"
                                returnKeyType="next"
                                @blur="checkName"></TextField>
                            <Label
                                class="size-10 char-count"
                                horizontalAlignment="right"
                                :text="module.name.length"
                                v-show="isEditingName"></Label>
                        </FlexboxLayout>
                        <StackLayout class="spacer-top" id="name-field-spacer"></StackLayout>
                        <Label
                            class="validation-error"
                            id="no-name"
                            horizontalAlignment="left"
                            :text="_L('nameRequired')"
                            textWrap="true"
                            :visibility="noName ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-too-long"
                            horizontalAlignment="left"
                            :text="_L('nameOver40')"
                            textWrap="true"
                            :visibility="nameTooLong ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="name-not-printable"
                            horizontalAlignment="left"
                            :text="_L('nameNotPrintable')"
                            textWrap="true"
                            :visibility="nameNotPrintable ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                    <!-- end edit name form -->
                    <Image
                        row="0"
                        class="m-10"
                        width="14"
                        horizontalAlignment="right"
                        v-show="!isEditingName"
                        @tap="toggleRename"
                        src="~/images/Icon_Edit.png"></Image>
                    <Image
                        row="0"
                        class="m-10"
                        width="17"
                        horizontalAlignment="right"
                        v-show="isEditingName"
                        @tap="saveModuleName"
                        src="~/images/Icon_Save.png"></Image>
                </GridLayout>

                <GridLayout rows="auto,auto,auto,auto" columns="50*,50*" class="m-x-10">
                    <Label row="0" colSpan="2" class="size-20" text="Data capture interval"></Label>
                    <Label row="1" colSpan="2" class="size-14 m-y-5" text="More frequent data reduces the battery quicker"></Label>
                    <TextField
                        row="2"
                        col="0"
                        horizontalAlignment="left"
                        verticalAligment="bottom"
                        class="input interval-input"
                        :isEnabled="true"
                        keyboardType="name"
                        autocorrect="false"
                        autocapitalizationType="none"
                        v-model="currentInterval"
                        @blur="checkInterval"></TextField>
                    <StackLayout row="2" col="1" horizontalAlignment="right" id="drop-down-container">
                        <DropDown :items="timeUnits" @selectedIndexChanged="onSelectedIndexChanged" backgroundColor="#F4F5F7" width="100%" class="drop-down" selectedIndex="2" ></DropDown>
                    </StackLayout>
                    <StackLayout row="3">
                        <Label
                            class="validation-error"
                            id="no-interval"
                            horizontalAlignment="left"
                            text="Interval must not be blank"
                            textWrap="true"
                            :visibility="noInterval ? 'visible' : 'collapsed'"></Label>
                        <Label
                            class="validation-error"
                            id="interval-not-numeric"
                            horizontalAlignment="left"
                            text="Interval must be a number"
                            textWrap="true"
                            :visibility="intervalNotNumber ? 'visible' : 'collapsed'"></Label>
                    </StackLayout>
                </GridLayout>

                <!-- footer -->
                <FlexboxLayout justifyContent="space-between" class="size-12 p-30 footer">
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Station_Selected.png"></Image>
                        <Label class="bold m-t-2" :text="_L('station')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Data_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('data')"></Label>
                    </StackLayout>
                    <StackLayout>
                        <Image width="20" src="~/images/Icon_Settings_Inactive.png"></Image>
                        <Label class="light m-t-2" :text="_L('settings')"></Label>
                    </StackLayout>
                </FlexboxLayout>

            </FlexboxLayout>
        </ScrollView>
    </Page>
</template>

<script>
    import routes from "../routes";
    import DatabaseInterface from "../services/db-interface";
    const dbInterface = new DatabaseInterface();

    export default {
        data() {
            return {
                currentInterval: 1,
                currentUnit: "hours",
                isEditingName: false,
                noName: false,
                nameNotPrintable: false,
                nameTooLong: false,
                noInterval: false,
                intervalNotNumber: false,
                module: {
                    name: "",
                    origName: ""
                },
                timeUnits: ["seconds", "minutes", "hours", "days", "weeks"]
            };
        },
        props: ['moduleId'],
        methods: {
            onPageLoaded(args) {
                this.page = args.object;

                this.$userAuth.getCurrentUser()
                    .then(response => {
                        this.user = response;
                    });

                dbInterface.getModule([this.moduleId])
                    .then(module => {
                        this.module = module[0];
                        this.module.origName = this.module.name;
                    });
            },

            goBack(event) {
                let cn = event.object.className;
                event.object.className = cn + " pressed";

                this.$navigateTo(routes.module, {
                    props: {
                        moduleId: this.module.module_id,
                        stationId: this.module.device_id
                    }
                });
            },

            toggleRename() {
                this.isEditingName = true;
            },

            checkName() {
                // reset these first
                this.noName = false;
                this.nameNotPrintable = false;
                this.nameTooLong = false;
                // then check
                this.noName = !this.module.name || this.module.name.length == 0;
                if(this.noName) {return false}
                let matches = this.module.name.match(/^[ \w~!@#$%^&*()-.']*$/);
                this.nameNotPrintable = !matches || matches.length == 0;
                this.nameTooLong = this.module.name.length > 40;
                return !this.nameTooLong && !this.nameNotPrintable;
            },

            saveModuleName() {
                let valid = this.checkName();
                if(valid) {
                    this.isEditingName = false;
                    dbInterface.setModuleName(this.module);
                    let configChange = {
                        module_id: this.module.modul_id,
                        before: this.module.origName,
                        after: this.module.name,
                        affected_field: "name",
                        author: this.user.name
                    };
                    dbInterface.recordModuleConfigChange(configChange);
                    this.module.origName = this.module.name;
                }
            },

            cancelRename() {
                this.isEditingName = false;
                this.noName = false;
                this.nameNotPrintable = false;
                this.nameTooLong = false;
                this.module.name = this.module.origName;
            },

            checkInterval() {
                // reset these first
                this.noInterval = false;
                this.intervalNotNumber = false;
                // then check
                this.noInterval = !this.currentInterval || this.currentInterval.length == 0;
                if(this.noInterval) {return false}
                let matches = this.currentInterval.match(/^\d+$/);
                this.intervalNotNumber = !matches || matches.length == 0;
                return !this.intervalNotNumber;
            },

            onSelectedIndexChanged(event) {
                // console.log("event.value", event.oldIndex, event.newIndex)
                this.currentUnit = timeUnits[event.newIndex];
            }

        }

    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles
    #module-name-field {
        width: 225;
        font-size: 16;
        color: $fk-primary-black;
    }

    #module-name-field .input {
        width: 195;
        border-bottom-color: $fk-primary-black;
        border-bottom-width: 1;
        padding-top: 3;
        padding-bottom: 2;
        padding-left: 0;
        padding-right: 0;
        margin: 0;
    }

    #module-name-field .char-count {
        width: 25;
        margin-top: 15;
        margin-left: 5;
    }

    .module-name {
        width: 195;
    }

    .validation-error {
        width: 195;
        font-size: 12;
        color: $fk-tertiary-red;
        border-top-color: $fk-tertiary-red;
        border-top-width: 2;
        padding-top: 5;
    }

    .interval-input {
        font-size: 18;
        width: 48%;
        padding: 5;
        border-bottom-width: 1;
        border-bottom-color: $fk-gray-lighter;
    }

    .round {
        width: 40;
        border-radius: 20;
    }

</style>