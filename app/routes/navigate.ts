import _ from "lodash";
import { Store } from "../store/types";
import * as MutationTypes from "../store/mutations";

export interface NavigateOptions {
    clearHistory: boolean | null;
    props: object | null;
}

export interface RouteState {
    startup?: boolean;
    connected?: boolean;
    listing?: boolean;
    station?: boolean;
    login?: boolean;
    developer?: boolean;
    dataSync?: boolean;
    props?: any | null;
    reading?: boolean;
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
            store.commit(MutationTypes.NAVIGATION, pageOrRoute.combine(options));
            return navigateTo(pageOrRoute.page, options);
        }
        console.log("nav: deprecated navigateTo");
        return navigateTo(pageOrRoute, options);
    };
}
