import _ from "lodash";
import { Station, Location, PhoneLocation } from "../types";
import * as MutationTypes from "../mutations";

export class MappedStation {
    constructor(public readonly deviceId: string, public readonly name: string, public readonly location: Location) {}
}

export class BoundingRectangle {
    constructor(public min: Location | null = null, public max: Location | null = null) {}

    empty(): boolean {
        return this.min == null || this.max == null;
    }

    include(l: Location): void {
        this.min = this.min == null ? l.clone() : this.min.minimum(l);
        this.max = this.max == null ? l.clone() : this.max.maximum(l);
    }

    contains(l: Location): boolean {
        if (this.min == null || this.max == null) {
            return false;
        }
        return (
            l.latitude >= this.min.latitude &&
            l.longitude >= this.min.longitude &&
            l.latitude <= this.max.latitude &&
            l.longitude <= this.max.longitude
        );
    }

    static around(center: Location, margin: number) {
        /*
		At 38 degrees North latitude:
		One degree of latitude equals approximately 364,000 feet (69
		miles), one minute equals 6,068 feet (1.15 miles), and
		one-second equals 101 feet.

		One-degree of longitude equals 288,200 feet (54.6 miles), one
		minute equals 4,800 feet (0.91 mile), and one second equals 80
		feet.
		*/
        const FeetPerLatitude = 364000; /* ft per degree */
        const FeetPerLongitude = 288200; /* ft per degree */
        const latitudeMargin = margin / FeetPerLatitude;
        const longitudeMargin = margin / FeetPerLongitude;
        const min = new Location(center.latitude - latitudeMargin, center.longitude - longitudeMargin);
        const max = new Location(center.latitude + latitudeMargin, center.longitude + longitudeMargin);
        return new BoundingRectangle(min, max);
    }
}

export class MapCenter {
    constructor(public readonly location: Location, public readonly bounds: BoundingRectangle, public readonly zoom: number) {}
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
            if (location) {
                newStations[station.deviceId] = new MappedStation(station.deviceId, station.name, location);
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
