import AppSettings from "../components/AppSettingsView";
import AssembleStation from "../components/onboarding/AssembleStationView";
import Calibration from "../components/CalibrationView";
import ConfigureModule from "../components/unused/ConfigureModuleView";
import ConnectStation from "../components/onboarding/ConnectStationView";
import DataSync from "../components/DataSyncView";
import DeveloperMenu from "../components/DeveloperMenuView";
import Login from "../components/LoginView";
import Module from "../components/ModuleDetailView";
import StationDetail from "../components/StationDetailView";
import StationListView from "../components/StationListView";
import StationSettings from "../components/settings/StationSettingsView";

import OnboardingStartView from "../components/onboarding/Start";
import OnboardingSearchingView from "../components/onboarding/Searching";
import OnboardingNearbyStationsView from "../components/onboarding/NearbyStations";
import SearchFailedView from "../components/onboarding/SearchFailed";
import OnboardingNetwork from "../components/onboarding/Network";
import RenameStation from "../components/onboarding/RenameStation";
import OnboardingReconnecting from "../components/onboarding/Reconnecting";

import DeployMap from "../components/deploy/DeployMapView";
import DeployNotes from "../components/deploy/DeployNotesView";
import DeployReview from "../components/deploy/DeployReviewView";

import { Route, RouteState } from "./navigate";

import CalibrateStart from "../calibration/Start";

const routes = {
    appSettings: new Route(AppSettings, {}),
    calibration: new Route(Calibration, { reading: true, connected: true }),
    configureModule: new Route(ConfigureModule, {}),
    connectStation: new Route(ConnectStation, {}),
    dataSync: new Route(DataSync, { dataSync: true }),
    deployMap: new Route(DeployMap, {}),
    deployNotes: new Route(DeployNotes, {}),
    deployReview: new Route(DeployReview, {}),
    developerMenu: new Route(DeveloperMenu, { developer: true }),
    login: new Route(Login, { login: true }),
    module: new Route(Module, {}),
    assembleStation: new Route(AssembleStation, {}),
    stations: new Route(StationListView, { listing: true }),
    stationDetail: new Route(StationDetail, { reading: true, station: true }),
    stationSettings: new Route(StationSettings, {}),
    onboarding: {
        start: new Route(OnboardingStartView, {}),
        searching: new Route(OnboardingSearchingView, {}),
        nearby: new Route(OnboardingNearbyStationsView, {}),
        searchFailed: new Route(SearchFailedView, {}),
        network: new Route(OnboardingNetwork, {}),
        rename: new Route(RenameStation, {}),
        reconnecting: new Route(OnboardingReconnecting, {}),
    },
    deploy: {
        start: new Route(DeployMap, { connected: true }),
        notes: new Route(DeployNotes, { connected: true }),
    },
    internal: {
        calibrate: new Route(CalibrateStart, { connected: false }),
    },
};

export default routes;
