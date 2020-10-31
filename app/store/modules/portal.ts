import _ from "lodash";
import Vue from "vue";
import { ActionContext } from "vuex";
import { ServiceRef } from "@/services";
import { CurrentUser } from "@/services/portal-interface";
import { ActionTypes, ChangePortalEnvAction } from "../actions";
import { PortalEnv } from "../types";
import { MutationTypes } from "../mutations";
import { AccountsTableRow, SettingsTableRow } from "../row-types";
import Config from "@/config";

const fkprd: PortalEnv = {
    name: "fkprd",
    baseUri: "https://api.fieldkit.org",
    ingestionUri: "https://api.fieldkit.org/ingestion",
};

const fkdev: PortalEnv = {
    name: "fkdev",
    baseUri: "https://api.fkdev.org",
    ingestionUri: "https://api.fkdev.org/ingestion",
};

export class PortalState {
    authenticated = false;
    settings: Record<string, unknown> = {};
    accounts: AccountsTableRow[] = [];
    currentUser: CurrentUser | null = null;
    availableEnvs: PortalEnv[] = [fkprd, fkdev];
    env: PortalEnv = fkprd;
}

type ActionParameters = ActionContext<PortalState, never>;

const getters = {};

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: ({ dispatch }: ActionParameters) => {
            return Promise.all([
                dispatch(ActionTypes.LOAD_SETTINGS),
                dispatch(ActionTypes.LOAD_ACCOUNTS),
                dispatch(ActionTypes.LOAD_PORTAL_ENVS),
            ]);
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
        [ActionTypes.UPDATE_SETTINGS]: ({ dispatch }: ActionParameters, settings) => {
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
                        commit(MutationTypes.SET_CURRENT_USER, sorted[0]);
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
                        .then(() => {
                            services.portal().setCurrentUser(self);
                            commit(MutationTypes.SET_CURRENT_USER, self);
                            return dispatch(ActionTypes.LOAD_ACCOUNTS);
                        })
                        .catch((e) => console.log(ActionTypes.UPDATE_ACCOUNT, e));
                });
        },
        [ActionTypes.LOGOUT_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .deleteAllAccounts()
                .then(() => {
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
                .then(() => {
                    services.portal().setCurrentUser(chosen[0]);
                    commit(MutationTypes.SET_CURRENT_USER, chosen[0]);
                })
                .catch((e) => console.log(ActionTypes.CHANGE_ACCOUNT, e));
        },
        [ActionTypes.LOAD_PORTAL_ENVS]: ({ commit, dispatch, state }: ActionParameters, payload: ChangePortalEnvAction) => {
            return services
                .db()
                .getAvailablePortalEnvs()
                .then((rows) => {
                    if (Config.env.developer) {
                        console.log("portal-envs: using developer");
                        const env = {
                            name: null,
                            baseUri: Config.baseUri,
                            ingestionUri: Config.ingestionUri,
                        };
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, env);
                    } else if (rows.length > 1) {
                        console.log("portal-envs", rows[0]);
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, rows[0]);
                    } else {
                        console.log("portal-envs", fkprd);
                        commit(MutationTypes.SET_CURRENT_PORTAL_ENV, fkprd);
                    }
                });
        },
        [ActionTypes.CHANGE_PORTAL_ENV]: ({ commit, dispatch, state }: ActionParameters, payload: ChangePortalEnvAction) => {
            return services
                .db()
                .updatePortalEnv(payload.env)
                .then(() => {
                    commit(MutationTypes.SET_CURRENT_PORTAL_ENV, payload.env);
                });
        },
    };
};

const mutations = {
    [MutationTypes.SET_CURRENT_USER]: (state: PortalState, currentUser: CurrentUser) => {
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
    [MutationTypes.LOAD_ACCOUNTS]: (state: PortalState, accounts: AccountsTableRow[]) => {
        Vue.set(state, "accounts", accounts);
    },
    [MutationTypes.SET_CURRENT_PORTAL_ENV]: (state: PortalState, env: PortalEnv) => {
        Vue.set(state, "env", env);
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
