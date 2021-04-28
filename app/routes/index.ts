import _ from "lodash";

import { VueConstructor } from "vue/types/vue";
import { Page, Frame } from "@nativescript/core";
import { NavigationEntryVue } from "nativescript-vue";
import { NavigationMutation } from "@/store/mutations";
import { OurStore } from "@/store/our-store";

import { Route, FullRoute, NavigateOptions, FirstTab } from "./navigate";

import { routes, fullRoutes, namedRoutes } from "./routes";

export * from "./navigate";

export { routes, fullRoutes };

import { getBus } from "@/components/NavigationBus";

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

// eslint-disable-next-line
export async function navigateBackToBookmark(vue: Vue, frameId: string | null): Promise<boolean> {
    const frameToNav = frameId || Frame.topmost().id;
    const frame = Frame.getFrameById(frameToNav);
    for (const a of frame.backStack) {
        const entryProps = a.entry as { props?: { bookmark?: boolean } };
        if (entryProps.props?.bookmark === true) {
            void vue.$navigateBack({ frame: frameToNav }, a);
            return true;
        }
    }
    return false;
}

let tabsReady = false;

getBus().$on("nav:tabs-ready", () => {
    console.log("nav:tabs-ready");
    tabsReady = true;
});

export function navigatorFactory(store: OurStore, navigateTo: NavigateToFunc) {
    /* eslint-disable */
    const navFn = async (pageOrRoute: FullRoute | Route | any, options: NavigateOptions | null): Promise<void> => {
        if (pageOrRoute instanceof FullRoute) {
            const route = namedRoutes[pageOrRoute.name];
            const page = route.page as any;
            // Verify top route is for TabbedLayout
            const firstTab = pageOrRoute.props.firstTab as FirstTab;
            console.log(`nav:full-route: have-tabs: ${tabsReady} firstTab ${firstTab}`);
            if (!tabsReady || !firstTab) {
                console.log(`nav:navigating to tabbed-layout`);
                store.commit(
                    new NavigationMutation(
                        pageOrRoute.frame || "<no-frame>",
                        pageOrRoute.name || "<no-name>",
                        page.options.__file || "<no-file>",
                        true
                    )
                );
                await navigateTo(
                    page,
                    _.extend(
                        options,
                        {
                            frame: pageOrRoute.frame,
                            props: pageOrRoute.props,
                            transition: {
                                name: "fade",
                                duration: 0,
                            },
                        },
                        pageOrRoute.options
                    )
                );
            } else {
                console.log(`nav:using existing tabbed-layout`);
                await navFn(firstTab.route, null);
                getBus().$emit("nav:tab", firstTab.index);
            }
        } else if (pageOrRoute instanceof Route) {
            const withDefaults = addDefaults(options, { frame: pageOrRoute.frame });
            const page = pageOrRoute.page as any;
            console.log("nav:route", pageOrRoute, withDefaults);
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
            console.log(`nav:vue: ${pageOrRoute.options.name} ${JSON.stringify(withDefaults)}`);
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

    return navFn;
}
