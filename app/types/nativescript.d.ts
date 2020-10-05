import { Services } from "@/services";

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo(where: any, options: any): Promise<any>;
        $services: Services;
    }
}

declare global {
    function _L(key: string, ...args: any[]): string;
}

declare const TNS_ENV: string;
