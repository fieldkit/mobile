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

function addDefaults(options: NavigateOptions | null, overrides: { frame: string | undefined }): NavigateOptions {
    const frame = Frame.topmost();
    if (!frame) throw new Error(`no top frame`);
    const defaults = {
        frame: overrides.frame || (frame ? frame.id : null),
        transition: {
            name: "fade",
        },
    };
    return _.extend({}, defaults, options);
}

export function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    /* eslint-disable */
    return async (pageOrRoute: FullRoute | Route | any, options: NavigateOptions | null): Promise<void> => {
        if (pageOrRoute instanceof FullRoute) {
            console.log("nav:full-route");
            const route = namedRoutes[pageOrRoute.name];
            const page = route.page as any;
            store.commit(
                new NavigationMutation(
                    pageOrRoute.frame || "<no-frame>",
                    pageOrRoute.name || "<no-name>",
                    page.options.__file || "<no-file>",
                    true
                )
            );
            await navigateTo(page, {
                frame: pageOrRoute.frame,
                props: pageOrRoute.props,
            });
        } else if (pageOrRoute instanceof Route) {
            const withDefaults = addDefaults(options, { frame: pageOrRoute.frame });
            const page = pageOrRoute.page as any;
            console.log("nav:route", pageOrRoute);
            store.commit(
                new NavigationMutation(
                    withDefaults.frame || "<no-frame>",
                    page.options.name || "<no-name>",
                    page.options.__file || "<no-file>",
                    false
                )
            );
            await navigateTo(pageOrRoute.page as VueConstructor, withDefaults);
        } else {
            const withDefaults = addDefaults(options, { frame: undefined });
            console.log("nav:vue");
            store.commit(
                new NavigationMutation(
                    withDefaults.frame || "<no-frame>",
                    pageOrRoute.options.name || "<no-name>",
                    pageOrRoute.options.__file || "<no-file>",
                    false
                )
            );
            await navigateTo(pageOrRoute, withDefaults);
        }
    };
}
