import _ from "lodash";

import DataSync from "../components/DataSyncView.vue";
import Login from "../components/LoginView.vue";

import StationDetail from "../components/StationDetailView.vue";
import StationListView from "../components/StationListView.vue";
import StationSettings from "../components/settings/StationSettingsView.vue";
import StationSettingsWiFiNetworks from "../components/settings/StationSettingsWiFiNetwork.vue";
import StationSettingsWiFiSchedule from "../components/settings/StationSettingsWiFiSchedule.vue";
import StationSettingsFirmware from "../components/settings/StationSettingsFirmware.vue";
import Calibrate from "../calibration/Calibrate.vue";

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

import FlowView from "@/reader/FlowView.vue";

import AppSettings from "../components/app-settings/AppSettingsView.vue";
import AppSettingsData from "../components/app-settings/AppSettingsDataView.vue";
import AppSettingsNotifications from "../components/app-settings/AppSettingsNotificationsView.vue";
import AppSettingsPermissions from "~/components/app-settings/AppSettingsPermissionsView.vue";
import AppSettingsHelp from "~/components/app-settings/AppSettingsHelpView.vue";
import AppSettingsHelpAppVersion from "~/components/app-settings/AppSettingsHelpAppVersionView.vue";
import AppSettingsLegal from "~/components/app-settings/AppSettingsLegalView.vue";
import AppSettingsUnits from "~/components/app-settings/AppSettingsUnitsView.vue";
import AppSettingsAccount from "~/components/app-settings/AppSettingsAccountView.vue";
import AppSettingsAccountAdd from "~/components/app-settings/AppSettingsAccountAddView.vue";
import AppSettingsAppearance from "~/components/app-settings/AppSettingsAppearanceView.vue";
import AppSettingsAppearanceLanguage from "~/components/app-settings/AppSettingsAppearanceLanguageView.vue";
import AppSettingsAppearanceFontSize from "~/components/app-settings/AppSettingsAppearanceFontSizeView.vue";
import DeveloperMenu from "../components/app-settings/DeveloperMenuView.vue";

import AddModuleView from "~/components/onboarding/AddModuleView.vue";
import NotificationsView from "~/components/NotificationsView.vue";

import DeploymentLocation from "~/components/onboarding/DeploymentLocation.vue";
import DataSyncOnboarding from "~/components/onboarding/DataSync.vue";
import CompleteSettings from "~/components/onboarding/CompleteSettings.vue";

import TabbedLayout from "~/components/TabbedLayout.vue";

import { Route, RouteTable, FullRoute } from "./navigate";

export const routes = {
    login: new Route(Login),
    tabbed: new Route(TabbedLayout),
    developerMenu: new Route(DeveloperMenu),

    // Bottom navigation
    stations: new Route(StationListView),
    dataSync: new Route(DataSync),
    appSettings: {
        list: new Route(AppSettings),
        data: new Route(AppSettingsData),
        units: new Route(AppSettingsUnits),
        notifications: new Route(AppSettingsNotifications),
        permissions: new Route(AppSettingsPermissions),
        account: new Route(AppSettingsAccount),
        accountAdd: new Route(AppSettingsAccountAdd),
        appearance: new Route(AppSettingsAppearance),
        appearanceFontSize: new Route(AppSettingsAppearanceFontSize),
        appearanceLanguage: new Route(AppSettingsAppearanceLanguage),
        help: new Route(AppSettingsHelp),
        helpAppVersion: new Route(AppSettingsHelpAppVersion),
        legal: new Route(AppSettingsLegal),
        developer: new Route(DeveloperMenu),
    },

    station: {
        detail: new Route(StationDetail),
        calibrate: new Route(Calibrate),
        settings: {
            menu: new Route(StationSettings),
            wifiSchedule: new Route(StationSettingsWiFiSchedule),
            wifiNetworks: new Route(StationSettingsWiFiNetworks),
            firmware: new Route(StationSettingsFirmware),
        },
    },

    // Onboarding
    onboarding: {
        assembleStation: new Route(AssembleStation),
        start: new Route(OnboardingStartView),
        searching: new Route(OnboardingSearchingView),
        nearby: new Route(OnboardingNearbyStationsView),
        searchFailed: new Route(SearchFailedView),
        network: new Route(OnboardingNetwork),
        addWifi: new Route(AddWifiNetwork),
        deploymentLocation: new Route(DeploymentLocation),
        dataSync: new Route(DataSyncOnboarding),
        rename: new Route(RenameStation),
        reconnecting: new Route(OnboardingReconnecting),
        recalibrate: new Route(Recalibrate),
        addModule: new Route(AddModuleView),
        completeSettings: new Route(CompleteSettings),
    },

    // Deployment
    deploy: {
        start: new Route(DeployMap),
        notes: new Route(DeployNotes),
        editing: new Route(EditNoteView),
        review: new Route(DeployReview),
    },

    // Reader
    reader: {
        flow: new Route(FlowView),
    },
    notifications: new Route(NotificationsView),
};

function inferNames(routes: RouteTable, prefix = ""): { [index: string]: Route } {
    const map: { [index: string]: Route } = {};
    for (const key of Object.keys(routes)) {
        const value = routes[key];
        if (value instanceof Route) {
            value.name = prefix + key;
            map[value.name] = value;
        } else {
            _.extend(map, inferNames(value, prefix + key + "/"));
        }
    }
    return map;
}

export const namedRoutes = inferNames(routes);

export const fullRoutes = {
    login: new FullRoute("login", "outer-frame", {}),
    tabbed: new FullRoute("tabbed", "outer-frame", {}),
    onboarding: new FullRoute("tabbed", "outer-frame", {
        firstTab: {
            index: 0,
            route: new FullRoute("onboarding/assembleStation", "stations-frame", {}),
        },
    }),
};
