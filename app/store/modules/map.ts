import _ from "lodash";
import { Station, PhoneLocation } from "../types";
import { BoundingRectangle, MapCenter, Location } from "../map-types";
import * as MutationTypes from "../mutations";

export class MappedStation {
    constructor(
        public readonly id: number,
        public readonly deviceId: string,
        public readonly name: string,
        public readonly location: Location,
        public readonly deployStartTime: Date | null
    ) {}
}

export class MapState {
    phone: Location | null = null;
    stations: { [index: string]: MappedStation } = {};
}

const getters = {
    hasCenter: (state: MapState): boolean => {
        return state.phone != null;
    },
    mapCenter: (state: MapState): MapCenter | null => {
        if (state.phone == null) {
            return null;
        }
        const FeetAroundPhone = 1000;
        const bounds = BoundingRectangle.around(state.phone, FeetAroundPhone);
        return new MapCenter(state.phone, bounds, 14);
    },
};

const actions = {};

const mutations = {
    [MutationTypes.STATIONS]: (state: MapState, stations: Station[]) => {
        const newStations = {};
        stations.forEach(station => {
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

const state = () => new MapState();

export const map = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
