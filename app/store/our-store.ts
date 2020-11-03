import { GlobalState, GlobalGetters } from "./modules/global";

export interface Store {
    commit<T>(typeOrMutation: string | { type: string }, mutation?: T): void;
    dispatch<T>(type: string, action: T): Promise<void>;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}
