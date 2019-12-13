import ConfigureModule from "../components/unused/ConfigureModuleView";
import DataSync from "../components/DataSyncView";
import DeployMap from "../components/DeployMapView";
import DeployNotes from "../components/DeployNotesView";
import DeployReview from "../components/DeployReviewView";
import Home from "../components/HomeView";
import Login from "../components/LoginView";
import Module from "../components/ModuleDetailView";
import Notifications from "../components/NotificationView";
import StationDetail from "../components/StationDetailView";
import Stations from "../components/StationListView";
import StationSettings from "../components/StationSettingsView";

const routes = {
    configureModule: ConfigureModule,
    dataSync: DataSync,
    deployMap: DeployMap,
    deployNotes: DeployNotes,
    deployReview: DeployReview,
    home: Home,
    login: Login,
    module: Module,
    notifications: Notifications,
    stationDetail: StationDetail,
    stations: Stations,
    stationSettings: StationSettings
};
export default routes;
