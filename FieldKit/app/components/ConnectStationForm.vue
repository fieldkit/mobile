<template>
    <StackLayout @loaded="onPageLoaded">
        <Label
            :text="label"
            class="m-y-20 size-16 text-center"
            textWrap="true"
            width="100%"
        />
        <!-- edit station name -->
        <GridLayout
            rows="auto"
            columns="*,30"
            class="bottom-bordered m-x-20"
            v-show="editingName"
        >
            <TextField
                col="0"
                textWrap="true"
                class="size-18 no-border-input"
                :hint="step.hint"
                v-model="stationName"
                keyboardType="name"
                autocorrect="false"
                autocapitalizationType="none"
                @blur="checkName"
            ></TextField>
            <Image
                col="1"
                width="17"
                @tap="cancelRename"
                src="~/images/Icon_Close.png"
            ></Image>
        </GridLayout>
        <!-- or edit ssid -->
        <TextField
            class="size-18 p-x-20 input"
            :hint="step.hint"
            autocorrect="false"
            autocapitalizationType="none"
            v-model="newNetwork.ssid"
            v-if="editingSsid"
        ></TextField>
        <!-- or edit password -->
        <TextField
            class="size-18 p-x-20 input"
            :hint="step.hint"
            secure="true"
            ref="password"
            v-model="newNetwork.password"
            v-if="editingPassword"
        ></TextField>

        <!-- station name validation errors -->
        <Label
            class="validation-error"
            id="no-name"
            :text="_L('nameRequired')"
            textWrap="true"
            :visibility="noName ? 'visible' : 'collapsed'"
        ></Label>
        <Label
            class="validation-error"
            id="name-too-long"
            :text="_L('nameOver40')"
            textWrap="true"
            :visibility="nameTooLong ? 'visible' : 'collapsed'"
        ></Label>
        <Label
            class="validation-error"
            id="name-not-printable"
            :text="_L('nameNotPrintable')"
            textWrap="true"
            :visibility="
                nameNotPrintable ? 'visible' : 'collapsed'
            "
        ></Label>

        <!-- known wifi networks -->
        <WrapLayout orientation="horizontal" v-if="showNetworks" class="networks-container">
            <Label text="Saved WiFi Networks" class="title" width="100%"></Label>
            <Label
                text="No saved networks"
                class="size-16 m-t-10"
                v-if="networks.length == 0"
            ></Label>
            <GridLayout
                rows="auto"
                columns="75*,25*"
                v-for="n in networks"
                :key="n.ssid"
            >
                <Label
                    :text="n.ssid"
                    col="0"
                    class="m-t-10"
                    @tap="useNetwork"
                ></Label>
            </GridLayout>
        </WrapLayout>
    </StackLayout>
</template>

<script>
import Services from "../services/services";

const queryStation = Services.QueryStation();
const stateManager = Services.StateManager();

export default {
    data() {
        return {
            label: "",
            stationName: "",
            origName: "",
            noName: false,
            nameTooLong: false,
            nameNotPrintable: false,
            loggedIn: this.$portalInterface.isLoggedIn(),
            networks: [],
            showNetworks: false,
            newNetwork: { ssid: "", password: "" },
            editingName: false,
            editingSsid: false,
            editingPassword: false,
        };
    },
    props: ["station", "step"],
    components: {},
    methods: {
        onPageLoaded(args) {
            this.page = args.object;
            let user = this.$portalInterface.getCurrentUser();
            this.userName = user.name;

            if (this.step.field == "stationName") {
                this.editingName = true;
                this.stationName = this.station.name;
                this.origName = this.stationName;
            }

            if (this.step.field == "ssid") {
                this.showNetworks = true;
                this.editingSsid = true;
                let deviceStatus = JSON.parse(this.station.statusJson);
                if (deviceStatus && deviceStatus.networkSettings) {
                    this.networks = deviceStatus.networkSettings.networks;
                }
            }
        },

        checkName() {
            // reset these first
            this.noName = false;
            this.nameNotPrintable = false;
            this.nameTooLong = false;
            // then check
            this.noName = !this.stationName || this.stationName.length == 0;
            if (this.noName) {
                this.stationName = this.origName;
                return false;
            }
            let matches = this.stationName.match(/^[ \w~!@#$%^&*()-.']*$/);
            this.nameNotPrintable = !matches || matches.length == 0;
            this.nameTooLong = this.stationName.length > 40;
            return !this.nameTooLong && !this.nameNotPrintable;
        },

        cancelRename() {
            this.editingName = true;
            this.stationName = "";
        },

        saveStationName() {
            let valid = this.checkName();
            if (valid && this.origName != this.stationName) {
                this.station.name = this.stationName;
                return stateManager
                    .renameStation(this.station, this.stationName)
                    .then(() => {
                        this.origName = this.stationName;
                    })
                    .catch(error => {
                        console.error("unhandled error", error);
                    });
            } else {
                return Promise.reject();
            }
        },

        goToPassword() {
            this.showNetworks = false;
            this.editingSsid = false;
            this.editingPassword = true;
            this.label = this.newNetwork.ssid;
        },

        addNetwork() {
            let network = {
                ssid: this.newNetwork.ssid,
                password: this.newNetwork.password
            };
            let index = this.networks.findIndex(n => {
                return n.ssid == network.ssid;
            });
            if (index > -1) {
                // replace if it's already present
                this.networks[index].password = network.password;
            } else {
                // otherwise add it
                this.networks.push(network);
            }

            return queryStation
                .sendNetworkSettings(this.station.url, this.networks)
                .then(result => {
                    this.networks = result.networkSettings.networks;
                });
        },

        useNetwork(event) {
            const network = this.networks.find(n => {
                return n.ssid == event.object.text;
            });
            this.newNetwork.ssid = network.ssid;
            this.newNetwork.password = network.password;
        }
    }
};
</script>

<style scoped lang="scss">
// Start custom common variables
@import "../app-variables";
// End custom common variables

// Custom styles
.networks-container {
    margin-top: 40;
    margin-left: 20;
    margin-right: 20;
}

.bottom-bordered {
    border-bottom-width: 1px;
    text-align: center;
    // iOS-only padding in app.ios.scss
}
.no-border-input {
    border-bottom-width: 1;
    border-bottom-color: white;
}

.input {
    width: 90%;
    margin-left: 20;
    margin-right: 20;
    border-bottom-width: 1px;
    text-align: center;
}
.validation-error {
    width: 100%;
    font-size: 13;
    margin-top: 5;
    color: $fk-tertiary-red;
    text-align: center;
}
</style>