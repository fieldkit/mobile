import _ from "lodash";
import { Component } from "vue";

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
    constructor(public readonly name: string, public readonly frame: string, public readonly props: Record<string, unknown>) {}
}

export class Route {
    public name = "unknown";

    constructor(public readonly page: Component) {}
}
