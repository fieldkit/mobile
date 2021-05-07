import { Module } from "vuex";
import { Station, PhoneLocation } from "../types";
import { BoundingRectangle, MapCenter, Location, MappedStations, MappedStation } from "../map-types";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";

export class MapState {
    phone: Location | null = null;
    stations: { [index: string]: MappedStation } = {};

    public get location(): Location {
        if (!this.phone) {
            const BowGlacier = [51.6466153, -116.5388066];
            return new Location(BowGlacier[0], BowGlacier[1]);
        }
        return this.phone;
    }
}

const getters = {
    mappedStations: (state: MapState): MappedStations | null => {
        const location = state.location;
        const FeetAroundPhone = 1000;
        const bounds = BoundingRectangle.around(location, FeetAroundPhone);
        return new MappedStations(new MapCenter(location, bounds, 14), Object.values(state.stations));
    },
};

const actions = (_services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.RESET]: (state: MapState) => {
        Object.assign(state, new MapState());
    },
    [MutationTypes.STATIONS]: (state: MapState, stations: Station[]) => {
        const newStations = {};
        stations.forEach((station) => {
            const location = station.location();
            if (location && station.id) {
                newStations[station.deviceId] = new MappedStation(
                    station.id,
                    station.deviceId,
                    station.name,
                    location,
                    station.deployStartTime
                );
            }
        });
        state.stations = newStations;
    },
    [MutationTypes.PHONE_LOCATION]: (state: MapState, phone: PhoneLocation) => {
        state.phone = phone.location();
    },
};

type ModuleType = Module<MapState, never>;

export const map = (services: ServiceRef): ModuleType => {
    const state = () => new MapState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
