import AppSettings from "../components/AppSettingsView";
import DataSync from "../components/DataSyncView";
import DeveloperMenu from "../components/DeveloperMenuView";
import Login from "../components/LoginView";

import StationDetail from "../components/StationDetailView";
import StationListView from "../components/StationListView";
import StationSettings from "../components/settings/StationSettingsView";
import Module from "../components/ModuleDetailView";
import ConfigureModule from "../components/unused/ConfigureModuleView";

import CalibrateStart from "../calibration/Start";

import AssembleStation from "../components/onboarding/AssembleStationView";
import OnboardingStartView from "../components/onboarding/Start";
import OnboardingSearchingView from "../components/onboarding/Searching";
import OnboardingNearbyStationsView from "../components/onboarding/NearbyStations";
import SearchFailedView from "../components/onboarding/SearchFailed";
import OnboardingNetwork from "../components/onboarding/Network";
import RenameStation from "../components/onboarding/RenameStation";
import Recalibrate from "../components/onboarding/Recalibrate";
import OnboardingReconnecting from "../components/onboarding/Reconnecting";

import DeployMap from "../components/deploy/DeployMapView";
import DeployNotes from "../components/deploy/DeployNotesView";
// import DeployReview from "../components/deploy/DeployReviewView";

import { Route } from "./navigate";

const routes = {
    login: new Route(Login, { login: true }),
    developerMenu: new Route(DeveloperMenu, { developer: true }),

    // Bottom navigation
    stations: new Route(StationListView, { listing: true }),
    dataSync: new Route(DataSync, { dataSync: true }),
    appSettings: new Route(AppSettings, {}),

    // Per station
    stationDetail: new Route(StationDetail, { reading: true, station: true }),
    stationSettings: new Route(StationSettings, {}),
    module: new Route(Module, {}),
    configureModule: new Route(ConfigureModule, {}),

    // Onboarding
    onboarding: {
        assembleStation: new Route(AssembleStation, {}),
        start: new Route(OnboardingStartView, {}),
        searching: new Route(OnboardingSearchingView, {}),
        nearby: new Route(OnboardingNearbyStationsView, {}),
        searchFailed: new Route(SearchFailedView, {}),
        network: new Route(OnboardingNetwork, {}),
        rename: new Route(RenameStation, {}),
        reconnecting: new Route(OnboardingReconnecting, {}),
        recalibrate: new Route(Recalibrate, {}),
    },

    // Deployment
    deploy: {
        start: new Route(DeployMap, { connected: true }),
        notes: new Route(DeployNotes, { connected: true }),
    },
    calibration: {
        start: new Route(CalibrateStart, { connected: true }),
    },
};

export default routes;
