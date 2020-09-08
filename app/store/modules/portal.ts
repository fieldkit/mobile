import Vue from "vue";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import {ServiceRef, Services} from "~/store/modules/utilities";
import {AccountsTableRow, SettingsTableRow} from "~/store/row-types";

export class PortalState {
    authenticated: boolean = false;
    services: ServiceRef = new ServiceRef();
    settings: any;
    accounts: any;
}

type ActionParameters = { commit: any; dispatch: any; state: any };

const getters = {};

const actions = {
    [ActionTypes.LOAD]: ({ commit, dispatch, state }: ActionParameters) => {
        dispatch(ActionTypes.LOAD_SETTINGS);
        dispatch(ActionTypes.LOAD_ACCOUNTS);
    },
    [ActionTypes.LOAD_SETTINGS]: ({ commit, dispatch, state }: ActionParameters) => {
        return state.services
            .db()
            .getSettings()
            .then((settings) => {
                commit(MutationTypes.LOAD_SETTINGS, settings)
            })
            .catch((e) => console.log('ActionTypes.LOAD_SETTINGS', e))
    },
    [ActionTypes.UPDATE_SETTINGS]: ({ commit, dispatch, state }: ActionParameters, settings) => {
        return state.services
            .db()
            .updateSettings(settings)
            .then((res) => {
                dispatch(ActionTypes.LOAD_SETTINGS);
                return res;
            })
            .catch((e) => console.log('ActionTypes.UPDATE_SETTINGS', e))
    },
    [ActionTypes.LOAD_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters) => {
        return state.services
            .db()
            .getAllAccounts()
            .then((accounts) => {
                commit(MutationTypes.LOAD_ACCOUNTS, accounts)
            })
            .catch((e) => console.log('ActionTypes.LOAD_ACCOUNTS', e))
    },
    [ActionTypes.UPDATE_ACCOUNT]: ({ commit, dispatch, state }: ActionParameters, account) => {
        return state.services
            .db()
            .addOrUpdateAccounts(account)
            .then((all) => {
                dispatch(ActionTypes.LOAD_ACCOUNTS);
            })
            .catch((e) => console.log('ActionTypes.UPDATE_ACCOUNT', e))
    },
    [ActionTypes.LOGOUT_ACCOUNTS]: ({ commit, dispatch, state }: ActionParameters) => {
        return state.services
            .db()
            .deleteAllAccounts()
            .then((all) => {
                commit(MutationTypes.LOGOUT_ACCOUNTS);
                dispatch(ActionTypes.LOAD_ACCOUNTS);
            })
            .catch((e) => console.log('ActionTypes.LOGOUT_ACCOUNTS', e))
    },
};

const mutations = {
    [MutationTypes.RESET]: (state: PortalState, error: string) => {
        Object.assign(state, new PortalState());
    },
    [MutationTypes.LOGIN]: (state: PortalState, token: string) => {
        Vue.set(state, "authenticated", true);
    },
    [MutationTypes.LOGOUT]: (state: PortalState) => {
        Vue.set(state, "authenticated", false);
    },
    [MutationTypes.SERVICES]: (state: PortalState, services: () => Services) => {
        Vue.set(state, "services", new ServiceRef(services));
    },
    [MutationTypes.LOAD_SETTINGS]: (state: PortalState, settings: SettingsTableRow) => {
        Vue.set(state, 'settings', settings[0].settingsObject);
    },

    [MutationTypes.LOGOUT_ACCOUNTS]: (state: PortalState) => {
        Vue.set(state, "accounts", []);
    },
    [MutationTypes.LOAD_ACCOUNTS]: (state: PortalState, accounts: AccountsTableRow) => {
        Vue.set(state, 'accounts', accounts);
    },
};

const state = () => new PortalState();

export const portal = {
    namespaced: false,
    state,
    getters,
    actions,
    mutations,
};
