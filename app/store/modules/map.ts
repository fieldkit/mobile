import _ from "lodash";
import { Station, PhoneLocation } from "../types";
import { BoundingRectangle, MapCenter, Location, MappedStations, MappedStation } from "../map-types";
import * as MutationTypes from "../mutations";
import { ServiceRef } from "@/services";

export class MapState {
    phone: Location | null = null;
    stations: { [index: string]: MappedStation } = {};
}

const getters = {
    mappedStations: (state: MapState): MappedStations | null => {
        if (state.phone == null) {
            return null;
        }
        const FeetAroundPhone = 1000;
        const bounds = BoundingRectangle.around(state.phone, FeetAroundPhone);
        return new MappedStations(new MapCenter(state.phone, bounds, 14), Object.values(state.stations));
    },
};

const actions = (services: ServiceRef) => {
    return {};
};

const mutations = {
    [MutationTypes.RESET]: (state: MapState, error: string) => {
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

export const map = (services: ServiceRef) => {
    const state = () => new MapState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
