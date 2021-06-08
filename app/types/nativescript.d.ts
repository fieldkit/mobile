import { navigateBack, ModalOptions } from "nativescript-vue";
import { Vue } from "vue/types/vue";
import { NavigateToFunc } from "@/routes/navigate";
import { Services } from "@/services";
import { OurStore } from "@/store";

type showModal = (component: typeof Vue, options?: ModalOptions) => Promise<unknown>;

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo: NavigateToFunc; // (where: any, options: any): Promise<void>;
        $deprecatedNavigateTo: NavigateToFunc; // (where: any, options: any): Promise<void>;
        $navigateBack: navigateBack;
        $showModal: showModal;
        $services: Services;
        $modal: {
            close: (value?: unknown) => void;
        };
        $s: OurStore;
    }
}

declare global {
    function _L(key: string, ...args: unknown[]): string;

    const TNS_ENV: string;

    const FK_VERSION: string;
    const FK_BUILD_TIMESTAMP: string;
    const FK_BUILD_NUMBER: string;
    const FK_BUILD_TAG: string;
    const FK_BUILD_JOB: string;
    const FK_GIT_COMMIT: string;
    const FK_GIT_BRANCH: string;

    // eslint-disable-next-line
    interface Event {}
}
