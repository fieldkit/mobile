import { Component, Vue } from "vue-property-decorator";

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo(where: any, options: any = {}): Promise<any>;
    }
}

declare global {
    function _L(key: string, ...args: any[]): string;
    TNS_ENV: string;
}
