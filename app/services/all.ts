import { OurStore } from "@/store";
import PortalInterface from "./portal-interface";
import PortalUpdater from "./portal-updater";
import DiscoverStation from "./discover-station";
import Diagnostics from "./diagnostics-service";
import DatabaseInterface from "./db-interface";
import QueryStation from "./query-station";
import PhoneLocation from "./phone-location";
import CalibrationService from "./calibration-service";
import StationFirmware from "./station-firmware";
import CreateDb from "./create-db";
import ImagesSaver from "./images-saver";
import AudioInterface from "./audio-interface";
import { TaskQueue } from "@/lib/tasks";

export interface FileSystem {
    getFolder(path: string): any;
    getFile(path: string): any;
    listFolder(path: string): any;
}

interface Connected {
    connectedWifi?: { ssid: string };
}

export interface Conservify {
    open(path: string): any;
    download(info: any): Promise<any>;
    findConnectedNetwork(): Promise<Connected>;
}

export {
    PortalInterface,
    PortalUpdater,
    DiscoverStation,
    Diagnostics,
    DatabaseInterface,
    QueryStation,
    PhoneLocation,
    StationFirmware,
    CalibrationService,
    CreateDb,
    ImagesSaver,
    AudioInterface,
    TaskQueue,
    OurStore,
};
