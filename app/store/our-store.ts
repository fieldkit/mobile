import { Commit, Dispatch } from "vuex";
import { GlobalState, GlobalGetters } from "./modules/global";

export interface Store {
    commit: Commit;
    dispatch: Dispatch;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}
