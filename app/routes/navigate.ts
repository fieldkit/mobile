import _ from "lodash";
import { Component } from "vue";
import { MutationTypes } from "@/store/mutations";
import { Store } from "@/store/our-store";
import { Frame } from "@nativescript/core";

export interface NavigateOptions {
    clearHistory: boolean | null;
    props: Record<string, unknown> | null;
    frame: string | null;
}

export interface RouteState {
    startup?: boolean;
    connected?: boolean;
    listing?: boolean;
    station?: boolean;
    login?: boolean;
    developer?: boolean;
    dataSync?: boolean;
    props?: Record<string, unknown> | null;
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
            inferNames(value, key + "/");
        }
    }
}

export class Route {
    public name = "unknown";

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

// eslint-disable-next-line
type NavigateToFunc = (page: any, options: NavigateOptions | null) => Promise<void>;

export default function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    // eslint-disable-next-line
    return (pageOrRoute: Route | any, options: NavigateOptions | null): Promise<void> => {
        const frame = Frame.topmost();
        if (options) {
            options.frame = options.frame || frame.id;
        }
        if (pageOrRoute instanceof Route) {
            const routeState = pageOrRoute.combine(options);
            store.commit(MutationTypes.NAVIGATION, { routeState: routeState, name: pageOrRoute.name, options: options });
            return navigateTo(pageOrRoute.page, options);
        }
        console.log("nav: deprecated navigateTo");
        return navigateTo(pageOrRoute, options);
    };
}
