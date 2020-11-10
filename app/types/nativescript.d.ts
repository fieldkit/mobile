import { Page } from "@nativescript/core";
import { navigateBack, ModalOptions, NavigationEntryVue } from "nativescript-vue";
import { Vue, VueConstructor } from "vue/types/vue";
import { Services } from "@/services";
import { Route } from "@/routes/navigate";

type showModal = (component: typeof Vue, options?: ModalOptions) => Promise<unknown>;

export type navigateTo = (component: VueConstructor | Route, options?: NavigationEntryVue, cb?: () => Page) => Promise<Page>;

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo: navigateTo; // (where: any, options: any): Promise<void>;
        $navigateBack: navigateBack;
        $showModal: showModal;
        $services: Services;
        $modal: {
            close: (value?: unknown) => void;
        };
    }
}

declare global {
    function _L(key: string, ...args: unknown[]): string;

    const TNS_ENV: string;

    const FK_BUILD_TIMESTAMP: string;
    const FK_BUILD_NUMBER: string;
    const FK_BUILD_TAG: string;
    const FK_GIT_COMMIT: string;
    const FK_GIT_BRANCH: string;
}
