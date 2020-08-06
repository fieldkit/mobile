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
import DeployReview from "../components/deploy/DeployReviewView.vue";

import FlowView from "@/reader/FlowView";

import { Route } from "./navigate";

const routes = {
    login: new Route(Login, { login: true }),
    developerMenu: new Route(DeveloperMenu, { developer: true }),

    // Bottom navigation
    stations: new Route(StationListView, { clear: true, listing: true }),
    dataSync: new Route(DataSync, { clear: true, dataSync: true }),
    appSettings: new Route(AppSettings, { clear: true }),

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
