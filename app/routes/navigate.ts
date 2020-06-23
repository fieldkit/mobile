import * as MutationTypes from "../store/mutations";

export interface Store {
    commit(type: string, mutation: any): void;
    dispatch(type: string, action: any): Promise<any>;
}

export interface NavigateOptions {
    clearHistory: boolean | null;
}

export class RouteState {
    public startup: boolean = false;
    public connected: boolean = false;
    public listing: boolean = false;
    public station: boolean = false;
    public login: boolean = false;
    public developer: boolean = false;
    public dataSync: boolean = false;
}

export class Route {
    constructor(public readonly page: any, public readonly state: RouteState) {}
}

type NavigateToFunc = (page: any, options: NavigateOptions) => Promise<any>;

export default function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    return (pageOrRoute: Route | any, options: NavigateOptions): Promise<any> => {
        if (pageOrRoute instanceof Route) {
            store.commit(MutationTypes.NAVIGATION, pageOrRoute.state);
            return navigateTo(pageOrRoute.page, options);
        }
        const error = new Error();
        console.log("nav: deprecated navigateTo", error.stack);
        return navigateTo(pageOrRoute, options);
    };
}
