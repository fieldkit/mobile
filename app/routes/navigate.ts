import _ from "lodash";
import { Vue } from "vue/types/vue";

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
    dataSync?: boolean;
    props?: Record<string, unknown> | null;
    reading?: boolean;
    clear?: boolean;
}

export type RouteTable = {
    [index: string]: RouteTable | Route;
};

export class FullRoute {
    constructor(
        public readonly name: string,
        public readonly frame: string,
        public readonly props: Record<string, unknown>,
        public readonly options?: {
            backstackVisible?: boolean;
            clearHistory?: boolean;
        }
    ) {}
}

export class Route {
    public name = "unknown";

    constructor(public readonly page: typeof Vue, public readonly frame: string | undefined = undefined) {}
}

export interface FirstTab {
    index: number;
    route: FullRoute | null;
    flow?: {
        flow: {
            name: string;
            index: number;
        };
        skipped: FullRoute;
        finished: FullRoute;
    };
}
