import { Services } from "@/services";

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo(where: any, options: any): Promise<any>;
        $services: Services;
    }
}

declare global {
    function _L(key: string, ...args: any[]): string;

    const TNS_ENV: string;

    const FK_BUILD_TIMESTAMP: string;
    const FK_BUILD_NUMBER: string;
    const FK_BUILD_TAG: string;
    const FK_GIT_COMMIT: string;
    const FK_GIT_BRANCH: string;
}
