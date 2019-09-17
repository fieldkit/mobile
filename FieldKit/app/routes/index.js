import ConfigureModule from "../components/ConfigureModuleView";
import DataDownload from "../components/DataDownloadView";
import DeployMap from "../components/DeployMapView";
import DeployNotes from "../components/DeployNotesView";
import Home from "../components/HomeView";
import Login from "../components/LoginView";
import Module from "../components/ModuleDetailView";
import StationDetail from "../components/StationDetailView";
import Stations from "../components/StationsView";

const routes = {
    configureModule: ConfigureModule,
    dataDownload: DataDownload,
    deployMap: DeployMap,
    deployNotes: DeployNotes,
    home: Home,
    login: Login,
    module: Module,
    stationDetail: StationDetail,
    stations: Stations
};
export default routes;
