import AppSettings from "../components/AppSettingsView.vue";
import DataSync from "../components/DataSyncView.vue";
import DeveloperMenu from "../components/DeveloperMenuView.vue";
import Login from "../components/LoginView.vue";

import StationDetail from "../components/StationDetailView.vue";
import StationListView from "../components/StationListView.vue";
import StationSettings from "../components/settings/StationSettingsView.vue";
import ConfigureModule from "../components/unused/ConfigureModuleView.vue";

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

import { Route } from "./navigate";
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

const routes = {
    login: new Route(Login, { login: true }),
    developerMenu: new Route(DeveloperMenu, { developer: true }),

    // Bottom navigation
    stations: new Route(StationListView, { clear: true, listing: true }),
    dataSync: new Route(DataSync, { clear: true, dataSync: true }),
    appSettings: {
        list: new Route(AppSettings, { clear: true }),
        data: new Route(AppSettingsData, { clear: true }),
        units: new Route(AppSettingsUnits, { clear: true }),
        notifications: new Route(AppSettingsNotifications, { clear: true }),
        permissions: new Route(AppSettingsPermissions, { clear: true }),
        account: new Route(AppSettingsAccount, { clear: true }),
        accountAdd: new Route(AppSettingsAccountAdd, { clear: true }),
        appearance: new Route(AppSettingsAppearance, { clear: true }),
        appearanceFontSize: new Route(AppSettingsAppearanceFontSize, { clear: true }),
        appearanceLanguage: new Route(AppSettingsAppearanceLanguage, { clear: true }),
        help: new Route(AppSettingsHelp, { clear: true }),
        helpAppVersion: new Route(AppSettingsHelpAppVersion, { clear: true }),
        legal: new Route(AppSettingsLegal, { clear: true }),
    },

    // Per station
    stationDetail: new Route(StationDetail, { reading: true, station: true }),
    stationSettings: new Route(StationSettings, {}),
    configureModule: new Route(ConfigureModule, {}),

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
};

export default routes;
