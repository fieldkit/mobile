import _ from "lodash";
import { Store } from "../store/types";
import * as MutationTypes from "../store/mutations";

export interface NavigateOptions {
    clearHistory: boolean | null;
    props: object | null;
}

export class RouteState {
    public startup: boolean = false;
    public connected: boolean = false;
    public listing: boolean = false;
    public station: boolean = false;
    public login: boolean = false;
    public developer: boolean = false;
    public dataSync: boolean = false;
    public props: any | null = null;
}

export class Route {
    constructor(public readonly page: any, public readonly state: RouteState) {}

    combine(options: NavigateOptions | null): RouteState {
        if (options && options.props) {
            const cloned = _.cloneDeep(this.state);
            cloned.props = options.props;
            return cloned;
        }
        return this.state;
    }
}

type NavigateToFunc = (page: any, options: NavigateOptions | null) => Promise<any>;

export default function navigatorFactory(store: Store, navigateTo: NavigateToFunc) {
    return (pageOrRoute: Route | any, options: NavigateOptions | null): Promise<any> => {
        if (pageOrRoute instanceof Route) {
            if (options) console.log("OPTIONS", options.props);
            store.commit(MutationTypes.NAVIGATION, pageOrRoute.combine(options));
            return navigateTo(pageOrRoute.page, options);
        }
        const error = new Error();
        console.log("nav: deprecated navigateTo", error.stack);
        return navigateTo(pageOrRoute, options);
    };
}
