import _ from "lodash";

import { VueConstructor } from "vue/types/vue";
import { Page } from "@nativescript/core";
import { NavigationEntryVue } from "nativescript-vue";
import { NavigationMutation } from "@/store/mutations";
import { Store } from "@/store/our-store";
import { Frame } from "@nativescript/core";

import { Route, FullRoute, NavigateOptions } from "./navigate";

import { routes, fullRoutes, namedRoutes } from "./routes";

export * from "./navigate";

export { routes, fullRoutes };

export type NavigateToFunc = (
    component: VueConstructor | Route | FullRoute,
    options?: NavigationEntryVue,
    cb?: () => Page
) => Promise<Page>;

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

export function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    // eslint-disable-next-line
    return async (pageOrRoute: FullRoute | Route | any, options: NavigateOptions | null): Promise<void> => {
        const withDefaults = addDefaults(options);
        if (pageOrRoute instanceof FullRoute) {
            const route = namedRoutes[pageOrRoute.name];
            const page = route.page as any;
            store.commit(new NavigationMutation(withDefaults.frame || "", page.options.name || "", page.options.__file || ""));
            await navigateTo(page, {
                frame: pageOrRoute.frame,
                props: pageOrRoute.props,
            });
        } else if (pageOrRoute instanceof Route) {
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
