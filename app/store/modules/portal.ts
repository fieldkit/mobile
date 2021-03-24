import _ from "lodash";
import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ServiceRef } from "@/services";
import { ActionTypes, LoginAction, ChangePortalEnvAction, SyncAccountAction, RemoveAccountAction } from "../actions";
import { PortalEnv, CurrentUser } from "../types";
import { MutationTypes } from "../mutations";
import { AccountsTableRow, SettingsTableRow } from "../row-types";
import Config from "@/config";

export { CurrentUser };

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
    accounts: CurrentUser[] = [];
    currentUser: CurrentUser | null = null;
    availableEnvs: PortalEnv[] = [fkprd, fkdev];
    env: PortalEnv = fkprd;
}

type ActionParameters = ActionContext<PortalState, never>;

const getters = {
    usersById(state: PortalState): { [id: number]: CurrentUser } {
        return _.fromPairs(
            state.accounts.map((row) => {
                return [row.portalId, _.extend({ transmission: null }, row)];
            })
        );
    },
};

function userToRow(user: CurrentUser): AccountsTableRow {
    return {
        portalId: user.portalId,
        name: user.name,
        email: user.email,
        token: user.token,
        usedAt: user.usedAt ?? new Date(),
        details: JSON.stringify(user),
    };
}

function rowToUser(row: AccountsTableRow): CurrentUser {
    if (row.details) {
        return JSON.parse(row.details) as CurrentUser;
    }
    console.log(`deprecated account-row: ${JSON.stringify(row)}`);
    return {
        portalId: row.portalId,
        name: row.name,
        email: row.email,
        token: row.token,
        usedAt: row.usedAt ?? new Date(),
        lastSync: null,
        transmission: null,
    };
}

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: async ({ state, dispatch }: ActionParameters) => {
            await Promise.all([
                dispatch(ActionTypes.LOAD_SETTINGS),
                dispatch(ActionTypes.LOAD_ACCOUNTS),
                dispatch(ActionTypes.LOAD_PORTAL_ENVS),
            ]);

            // These are for developers only, we never store passwords for users.
            if (state.accounts.length == 0) {
                const users = Config.defaultUsers;
                if (users.length > 0) {
                    try {
                        console.log(`authenticating default-users`);
                        void Promise.all(
                            users.map(async (da) => {
                                try {
                                    await dispatch(new LoginAction(da.email, da.password));
                                    console.log(`authenticated: ${JSON.stringify(da.email)}`);
                                } catch (error) {
                                    console.log(`default-user failed: ${JSON.stringify(error)}`);
                                }
                            })
                        );
                    } catch (error) {
                        console.log(`failed: ${JSON.stringify(error)}`);
                    }
                }
            }
        },
        [ActionTypes.LOAD_SETTINGS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getSettings()
                .then((settings) => {
                    commit(MutationTypes.LOAD_SETTINGS, settings);
                })
                .catch((e) => console.log(ActionTypes.LOAD_SETTINGS, e));
        },
        [ActionTypes.UPDATE_SETTINGS]: async ({ dispatch }: ActionParameters, settings) => {
            await services
                .db()
                .updateSettings(settings)
                .then((res) => dispatch(ActionTypes.LOAD_SETTINGS).then(() => res))
                .catch((e) => console.log(ActionTypes.UPDATE_SETTINGS, e));
        },
        [ActionTypes.LOAD_ACCOUNTS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .getAllAccounts()
                .then((rows) => {
                    const users = rows.map(rowToUser);
                    commit(MutationTypes.LOAD_ACCOUNTS, users);
                    const sorted = _.reverse(_.sortBy(users, (a) => a.usedAt));
                    if (sorted.length > 0 && !state.currentUser) {
                        commit(MutationTypes.SET_CURRENT_USER, sorted[0]);
                    }
                })
                .catch((e) => console.log(ActionTypes.LOAD_ACCOUNTS, e));
        },
        /*
        [ActionTypes.REGISTER]: async ({ commit, dispatch, state }: ActionParameters, payload: RegisterAction) => {
            const portal = services.portal();
            const value = await portal.register(payload);
            console.log(`register: ${JSON.stringify(value)}`);
            console.log("register-value", value);
        },
		*/
        [ActionTypes.LOGIN]: async ({ commit, dispatch, state }: ActionParameters, payload: LoginAction) => {
            const portal = services.portal();
            const self = await portal.login(payload);

            await services.db().addOrUpdateAccounts(userToRow(self));

            await dispatch(ActionTypes.LOAD_ACCOUNTS);

            await dispatch(ActionTypes.AUTHENTICATED);
        },
        [ActionTypes.LOGOUT_ACCOUNTS]: async ({ commit, dispatch, state }: ActionParameters) => {
            await services
                .db()
                .deleteAllAccounts()
                .then(() => {
                    commit(MutationTypes.LOGOUT_ACCOUNTS);
                    return dispatch(ActionTypes.LOAD_ACCOUNTS);
                })
                .catch((e) => console.log(ActionTypes.LOGOUT_ACCOUNTS, e));

            commit(MutationTypes.LOGOUT);
        },
        [ActionTypes.CHANGE_ACCOUNT]: async ({ commit, dispatch, state }: ActionParameters, email: string) => {
            const chosen = state.accounts.filter((a) => a.email === email);
            if (chosen.length == 0) throw new Error(`no such account: ${email}`);
            await services
                .db()
                .addOrUpdateAccounts(userToRow(chosen[0]))
                .then(() => {
                    commit(MutationTypes.SET_CURRENT_USER, chosen[0]);
                })
                .catch((e) => console.log(ActionTypes.CHANGE_ACCOUNT, e));
        },
        [ActionTypes.LOAD_PORTAL_ENVS]: async ({ commit, dispatch, state }: ActionParameters, _payload: ChangePortalEnvAction) => {
            const rows = await services.db().getAvailablePortalEnvs();
            if (Config.env.developer) {
                console.log(`portal-envs: using developer`);
                const env = {
                    name: null,
                    baseUri: Config.baseUri,
                    ingestionUri: Config.ingestionUri,
                };
                commit(MutationTypes.SET_CURRENT_PORTAL_ENV, env);
            } else if (rows.length > 1) {
                console.log(`portal-envs: ${JSON.stringify(rows[0])}`);
                commit(MutationTypes.SET_CURRENT_PORTAL_ENV, rows[0]);
            } else {
                console.log(`portal-envs: ${JSON.stringify(fkprd)}`);
                commit(MutationTypes.SET_CURRENT_PORTAL_ENV, fkprd);
            }
        },
        [ActionTypes.CHANGE_PORTAL_ENV]: async ({ commit, dispatch, state }: ActionParameters, payload: ChangePortalEnvAction) => {
            await services.db().updatePortalEnv(payload.env);
            commit(MutationTypes.SET_CURRENT_PORTAL_ENV, payload.env);
        },
        [ActionTypes.REFRESH_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters, payload: ChangePortalEnvAction) => {
            console.log(`refresh`, payload);
        },
        [ActionTypes.REMOVE_ACCOUNT]: async ({ commit, dispatch, state }: ActionParameters, payload: RemoveAccountAction) => {
            await services.db().removeAccount(payload.email);
            await dispatch(ActionTypes.LOAD_ACCOUNTS);
        },
        [ActionTypes.SYNC_ACCOUNT]: async ({ commit, dispatch, state }: ActionParameters, payload: SyncAccountAction) => {
            console.log(`sync`, payload);
            await services.updater().addOrUpdateStations();
        },
    };
};

const mutations = {
    [MutationTypes.RESET]: (state: PortalState) => {
        Object.assign(state, new PortalState());
    },
    [MutationTypes.SET_CURRENT_USER]: (state: PortalState, currentUser: CurrentUser) => {
        Vue.set(state, "currentUser", currentUser);
    },
    [MutationTypes.REMOVE_ACCOUNT]: (state: PortalState, account: CurrentUser) => {
        if (state.currentUser && state.currentUser.email == account.email) {
            Vue.set(state, "currentUser", null);
            Vue.set(state, "authenticated", false);
        }
    },
    [MutationTypes.LOGIN]: (state: PortalState) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: PortalState) => {
        Vue.set(state, "authenticated", false);
        Vue.set(state, "currentUser", null);
    },
    [MutationTypes.LOAD_SETTINGS]: (state: PortalState, rows: SettingsTableRow[]) => {
        if (rows.length == 0) {
            Vue.set(state, "settings", {});
        } else {
            Vue.set(state, "settings", rows[0].settingsObject);
        }
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

export interface Settings {
    data?: {
        autoSyncStation: boolean;
        autoSyncPortal: boolean;
        mobileDataUsage: boolean;
    };
    notifications?: {
        pushNotifications: boolean;
    };
    units?: {
        unitSystem: string;
        temperature: string;
        unitName: string;
        pressure: string;
        velocity: string;
    };
    permissions?: {
        location: boolean;
        files: boolean;
        camera: boolean;
        microphone: boolean;
    };
    appearance?: {
        fontSize: number;
        language: string;
        darkMode: boolean;
    };
    help?: {
        appVersion: {
            updates: boolean;
            downloadUpdates: boolean;
        };
        crashReports: boolean;
        tutorialGuide: boolean;
    };
    legal?: {
        //
    };
}

type ModuleType = Module<PortalState, never>;

export const portal = (services: ServiceRef): ModuleType => {
    const state = () => new PortalState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
