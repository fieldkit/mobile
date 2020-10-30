import _ from "lodash";
import { Component } from "vue";
import { MutationTypes } from "../store/mutations";

export interface NavigateOptions {
    clearHistory: boolean | null;
    props: object | null;
}

export interface RouteState {
    startup?: boolean;
    connected?: boolean;
    listing?: boolean;
    station?: boolean;
    login?: boolean;
    developer?: boolean;
    dataSync?: boolean;
    props?: any | null;
    reading?: boolean;
    clear?: boolean;
}

export type RouteTable = {
    [index: string]: RouteTable | Route;
};

export function inferNames(routes: RouteTable, prefix = ""): void {
    for (const key of Object.keys(routes)) {
        const value = routes[key];
        if (value instanceof Route) {
            value.name = prefix + key;
        } else {
            inferNames(value as RouteTable, key + "/");
        }
    }
}

export class Route {
    public name: string = "unknown";

    constructor(public readonly page: Component, public readonly state: RouteState) {}

    combine(options: NavigateOptions | null): RouteState {
        if (options && options.props) {
            const cloned = _.cloneDeep(this.state);
            cloned.props = options.props;
            return cloned;
        }
        return this.state;
    }
}

type NavigateToFunc = (page: any, options: NavigateOptions | null) => Promise<any>;

export default function navigatorFactory(store: any, navigateTo: NavigateToFunc) {
    return (pageOrRoute: Route | any, options: NavigateOptions | null): Promise<any> => {
        if (pageOrRoute instanceof Route) {
            const routeState = pageOrRoute.combine(options);
            store.commit(MutationTypes.NAVIGATION, { routeState: routeState, name: pageOrRoute.name });
            return navigateTo(pageOrRoute.page, options);
        }
        console.log("nav: deprecated navigateTo");
        return navigateTo(pageOrRoute, options);
    };
}
