import _ from "lodash";
import Vue from "vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { ServiceRef } from "@/services";
import { AccountsTableRow, SettingsTableRow } from "~/store/row-types";
import { CurrentUser } from "@/services/portal-interface";

export class PortalState {
    authenticated: boolean = false;
    settings: any;
    accounts: any;
    currentUser: CurrentUser | null = null;
}

type ActionParameters = { commit: any; dispatch: any; state: any };

const getters = {};

export const SET_CURRENT_USER = "SET_CURRENT_USER";

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: ({ commit, dispatch, state }: ActionParameters) => {
            return Promise.all([dispatch(ActionTypes.LOAD_SETTINGS), dispatch(ActionTypes.LOAD_ACCOUNTS)]);
        },
        [ActionTypes.LOAD_SETTINGS]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .getSettings()
                .then((settings) => {
                    commit(MutationTypes.LOAD_SETTINGS, settings);
                })
                .catch((e) => console.log(ActionTypes.LOAD_SETTINGS, e));
        },
        [ActionTypes.UPDATE_SETTINGS]: ({ commit, dispatch, state }: ActionParameters, settings) => {
            return services
                .db()
                .updateSettings(settings)
                .then((res) => dispatch(ActionTypes.LOAD_SETTINGS).then(() => res))
                .catch((e) => console.log(ActionTypes.UPDATE_SETTINGS, e));
        },
        [ActionTypes.LOAD_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .getAllAccounts()
                .then((accounts) => {
                    commit(MutationTypes.LOAD_ACCOUNTS, accounts);
                    const sorted = _.reverse(_.sortBy(accounts, (a) => a.usedAt));
                    if (sorted.length > 0) {
                        console.log("currentUser", sorted); // PRIVACY ANONYMIZE
                        services.portal().setCurrentUser(sorted[0]);
                        commit(SET_CURRENT_USER, sorted[0]);
                    }
                })
                .catch((e) => console.log(ActionTypes.LOAD_ACCOUNTS, e));
        },
        [ActionTypes.AUTHENTICATED]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .portal()
                .whoAmI()
                .then((self) => {
                    console.log("authenticated", self);
                    return services
                        .db()
                        .addOrUpdateAccounts(self)
                        .then((all) => {
                            services.portal().setCurrentUser(self);
                            commit(SET_CURRENT_USER, self);
                            return dispatch(ActionTypes.LOAD_ACCOUNTS);
                        })
                        .catch((e) => console.log(ActionTypes.UPDATE_ACCOUNT, e));
                });
        },
        [ActionTypes.LOGOUT_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .deleteAllAccounts()
                .then((all) => {
                    commit(MutationTypes.LOGOUT_ACCOUNTS);
                    return dispatch(ActionTypes.LOAD_ACCOUNTS);
                })
                .catch((e) => console.log(ActionTypes.LOGOUT_ACCOUNTS, e));
        },
        [ActionTypes.CHANGE_ACCOUNT]: ({ commit, dispatch, state }: ActionParameters, email: string) => {
            const chosen = state.accounts.filter((a) => a.email === email);
            if (chosen.length == 0) throw new Error(`no such account: ${email}`);
            return services
                .db()
                .addOrUpdateAccounts(chosen[0])
                .then((all) => {
                    services.portal().setCurrentUser(chosen[0]);
                    commit(SET_CURRENT_USER, chosen[0]);
                })
                .catch((e) => console.log(ActionTypes.CHANGE_ACCOUNT, e));
        },
    };
};

const mutations = {
    [SET_CURRENT_USER]: (state: PortalState, currentUser: CurrentUser) => {
        Vue.set(state, "currentUser", currentUser);
    },
    [MutationTypes.RESET]: (state: PortalState, error: string) => {
        Object.assign(state, new PortalState());
    },
    [MutationTypes.LOGIN]: (state: PortalState, token: string) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: PortalState) => {
        Vue.set(state, "authenticated", false);
    },
    [MutationTypes.LOAD_SETTINGS]: (state: PortalState, settings: SettingsTableRow) => {
        Vue.set(state, "settings", settings[0].settingsObject);
    },
    [MutationTypes.LOGOUT_ACCOUNTS]: (state: PortalState) => {
        Vue.set(state, "accounts", []);
    },
    [MutationTypes.LOAD_ACCOUNTS]: (state: PortalState, accounts: AccountsTableRow) => {
        Vue.set(state, "accounts", accounts);
    },
};

export const portal = (services: ServiceRef) => {
    const state = () => new PortalState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
