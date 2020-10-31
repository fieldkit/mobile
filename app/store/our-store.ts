import { GlobalState, GlobalGetters } from "./modules/global";

export interface Store {
    commit(typeOrMutation: string | { type: string }, mutation?: any): void;
    dispatch(type: string, action: any): Promise<void>;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}
