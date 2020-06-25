import { Component, Vue } from "vue-property-decorator";

declare module "vue/types/vue" {
    interface Vue {
        $navigateTo(where: any, options: any = {}): Promise<any>;
    }
}
