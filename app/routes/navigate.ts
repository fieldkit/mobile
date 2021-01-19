import _ from "lodash";
import { Component } from "vue";
import { NavigationMutation } from "@/store/mutations";
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

function addDefaults(options: NavigateOptions | null): NavigateOptions {
    const frame = Frame.topmost();
    const defaults = {
        frame: frame ? frame.id : null,
        transition: {
            name: "fade",
        },
    };
    return _.extend({}, defaults, options);
}

export default function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    // eslint-disable-next-line
    return (pageOrRoute: Route | any, options: NavigateOptions | null): Promise<void> => {
        const withDefaults = addDefaults(options);
        if (pageOrRoute instanceof Route) {
            // eslint-disable-next-line
            const page = pageOrRoute.page as any;
            // eslint-disable-next-line
            store.commit(new NavigationMutation(withDefaults.frame || "", page.options.name || "", page.options.__file || ""));
            return navigateTo(pageOrRoute.page, withDefaults);
        }
        // eslint-disable-next-line
        store.commit(new NavigationMutation(withDefaults.frame || "", pageOrRoute.options.name || "", pageOrRoute.options.__file || ""));
        return navigateTo(pageOrRoute, withDefaults);
    };
}
