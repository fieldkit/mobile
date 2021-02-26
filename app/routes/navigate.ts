import _ from "lodash";
import { Component } from "vue";
import { VueConstructor } from "vue/types/vue";
import { Page } from "@nativescript/core";
import { NavigationEntryVue } from "nativescript-vue";
import { NavigationMutation } from "@/store/mutations";
import { Store } from "@/store/our-store";
import { Frame } from "@nativescript/core";

export interface NavigateOptions {
    clearHistory: boolean | undefined;
    props: Record<string, unknown> | undefined;
    frame: string | undefined;
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

export function inferNames(routes: RouteTable, prefix = ""): { [index: string]: Route } {
    const map: { [index: string]: Route } = {};
    for (const key of Object.keys(routes)) {
        const value = routes[key];
        if (value instanceof Route) {
            value.name = prefix + key;
            map[value.name] = value;
        } else {
            _.extend(map, inferNames(value, prefix + key + "/"));
        }
    }
    return map;
}

export class FullRoute {
    constructor(public readonly name: string, public readonly frame: string, public readonly props: Record<string, unknown>) {}
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

export type NavigateToFunc = (component: VueConstructor | Route, options?: NavigationEntryVue, cb?: () => Page) => Promise<Page>;

function addDefaults(options: NavigateOptions | null): NavigateOptions {
    const frame = Frame.topmost();
    if (!frame) throw new Error(`no top frame`);
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
    return async (pageOrRoute: Route | any, options: NavigateOptions | null): Promise<void> => {
        const withDefaults = addDefaults(options);
        if (pageOrRoute instanceof Route) {
            // eslint-disable-next-line
            const page = pageOrRoute.page as any;
            // eslint-disable-next-line
            store.commit(new NavigationMutation(withDefaults.frame || "", page.options.name || "", page.options.__file || ""));
            await navigateTo(pageOrRoute.page as VueConstructor, withDefaults);
        } else {
            store.commit(
                // eslint-disable-next-line
                new NavigationMutation(withDefaults.frame || "", pageOrRoute.options.name || "", pageOrRoute.options.__file || "")
            );
            await navigateTo(pageOrRoute, withDefaults);
        }
    };
}
