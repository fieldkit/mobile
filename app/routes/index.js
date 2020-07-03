import AppSettings from "../components/AppSettingsView";
import AssembleStation from "../components/onboarding/AssembleStationView";
import Calibration from "../components/CalibrationView";
import ConfigureModule from "../components/unused/ConfigureModuleView";
import ConnectStation from "../components/onboarding/ConnectStationView";
import DataSync from "../components/DataSyncView";
import DeployMap from "../components/DeployMapView";
import DeployNotes from "../components/DeployNotesView";
import DeployReview from "../components/DeployReviewView";
import DeveloperMenu from "../components/DeveloperMenuView";
import Login from "../components/LoginView";
import Module from "../components/ModuleDetailView";
import StationDetail from "../components/StationDetailView";
import StationListView from "../components/StationListView";
import StationSettings from "../components/settings/StationSettingsView";

import { Route, RouteState } from "./navigate";

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
};

export default routes;
