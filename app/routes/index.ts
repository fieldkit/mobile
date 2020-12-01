import AppSettings from "../components/AppSettingsView.vue";
import DataSync from "../components/DataSyncView.vue";
import DeveloperMenu from "../components/DeveloperMenuView.vue";
import Login from "../components/LoginView.vue";

import StationDetail from "../components/StationDetailView.vue";
import StationListView from "../components/StationListView.vue";
import StationSettings from "../components/settings/StationSettingsView.vue";
import StationSettingsWiFiNetworks from "../components/settings/StationSettingsWiFiNetwork.vue";
import StationSettingsFirmware from "../components/settings/StationSettingsFirmware.vue";

import CalibrateStart from "../calibration/Start.vue";

import AssembleStation from "../components/onboarding/AssembleStationView.vue";
import OnboardingStartView from "../components/onboarding/Start.vue";
import OnboardingSearchingView from "../components/onboarding/Searching.vue";
import OnboardingNearbyStationsView from "../components/onboarding/NearbyStations.vue";
import SearchFailedView from "../components/onboarding/SearchFailed.vue";
import OnboardingNetwork from "../components/onboarding/Network.vue";
import RenameStation from "../components/onboarding/RenameStation.vue";
import Recalibrate from "../components/onboarding/Recalibrate.vue";
import OnboardingReconnecting from "../components/onboarding/Reconnecting.vue";
import AddWifiNetwork from "../components/onboarding/AddWifi.vue";

import DeployMap from "../components/deploy/DeployMapView.vue";
import DeployNotes from "../components/deploy/DeployNotesView.vue";
import EditNoteView from "../components/deploy/EditNoteView.vue";
import DeployReview from "../components/deploy/DeployReviewView.vue";

import AppSettingsData from "../components/AppSettingsDataView.vue";
import AppSettingsNotifications from "../components/AppSettingsNotificationsView.vue";

import FlowView from "@/reader/FlowView.vue";

import AppSettingsPermissions from "~/components/AppSettingsPermissionsView.vue";
import AppSettingsHelp from "~/components/AppSettingsHelpView.vue";
import AppSettingsHelpAppVersion from "~/components/AppSettingsHelpAppVersionView.vue";
import AppSettingsLegal from "~/components/AppSettingsLegalView.vue";
import AppSettingsUnits from "~/components/AppSettingsUnitsView.vue";
import AppSettingsAccount from "~/components/AppSettingsAccountView.vue";
import AppSettingsAccountAdd from "~/components/AppSettingsAccountAddView.vue";
import AppSettingsAppearance from "~/components/AppSettingsAppearanceView.vue";
import AppSettingsAppearanceLanguage from "~/components/AppSettingsAppearanceLanguageView.vue";
import AppSettingsAppearanceFontSize from "~/components/AppSettingsAppearanceFontSizeView.vue";
import AddModuleView from "~/components/onboarding/AddModuleView.vue";
import NotificationsView from "~/components/NotificationsView.vue";

import { inferNames, Route } from "./navigate";

const routes = {
    login: new Route(Login, { login: true }),
    developerMenu: new Route(DeveloperMenu, { developer: true }),

    // Bottom navigation
    stations: new Route(StationListView, { clear: true, listing: true }),
    dataSync: new Route(DataSync, { clear: true, dataSync: true }),
    appSettings: {
        list: new Route(AppSettings, { clear: true }),
        data: new Route(AppSettingsData, {}),
        units: new Route(AppSettingsUnits, {}),
        notifications: new Route(AppSettingsNotifications, {}),
        permissions: new Route(AppSettingsPermissions, {}),
        account: new Route(AppSettingsAccount, {}),
        accountAdd: new Route(AppSettingsAccountAdd, {}),
        appearance: new Route(AppSettingsAppearance, {}),
        appearanceFontSize: new Route(AppSettingsAppearanceFontSize, {}),
        appearanceLanguage: new Route(AppSettingsAppearanceLanguage, {}),
        help: new Route(AppSettingsHelp, {}),
        helpAppVersion: new Route(AppSettingsHelpAppVersion, {}),
        legal: new Route(AppSettingsLegal, {}),
    },

    // Per station
    stationDetail: new Route(StationDetail, { reading: true, station: true }),
    stationSettings: new Route(StationSettings, {}),

    station: {
        settings: {
            wifiNetworks: new Route(StationSettingsWiFiNetworks, {}),
            firmware: new Route(StationSettingsFirmware, {}),
        },
    },

    // Onboarding
    onboarding: {
        assembleStation: new Route(AssembleStation, {}),
        start: new Route(OnboardingStartView, {}),
        searching: new Route(OnboardingSearchingView, {}),
        nearby: new Route(OnboardingNearbyStationsView, {}),
        searchFailed: new Route(SearchFailedView, {}),
        network: new Route(OnboardingNetwork, {}),
        addWifi: new Route(AddWifiNetwork, {}),

        rename: new Route(RenameStation, {}),
        reconnecting: new Route(OnboardingReconnecting, {}),
        recalibrate: new Route(Recalibrate, {}),
        addModule: new Route(AddModuleView, {}),
    },

    // Deployment
    deploy: {
        start: new Route(DeployMap, { connected: true }),
        notes: new Route(DeployNotes, { connected: true }),
        editing: new Route(EditNoteView, { connected: true }),
        review: new Route(DeployReview, { connected: true }),
    },
    calibration: {
        start: new Route(CalibrateStart, { connected: true }),
    },

    // Reader
    reader: {
        flow: new Route(FlowView, {}),
    },
    notifications: new Route(NotificationsView, {}),
};

inferNames(routes);

export default routes;
