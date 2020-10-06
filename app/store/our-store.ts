import { GlobalState, GlobalGetters } from "./modules/global";

export interface Store {
    commit(type: string, mutation: any): void;
    dispatch(type: string, action: any): Promise<any>;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}
