import { Store, Commit, Dispatch } from "vuex";
import { GlobalState, GlobalGetters } from "./modules/global";

export interface OurStore extends Store<GlobalState> {
    commit: Commit;
    dispatch: Dispatch;
    readonly state: GlobalState;
    readonly getters: GlobalGetters;
}
