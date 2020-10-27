import Vue from "vue";
import { ActionContext } from "vuex";
import * as ActionTypes from "../actions";
import * as MutationTypes from "../mutations";
import { ServiceRef } from "@/services";
import { NotificationsTableRow } from "~/store/row-types";

export class NotificationsState {
    notifications: Notification[] = [];
}

export interface Notification {
    id?: number;
    key: string;
    kind?: string;
    created?: number;
    silenced?: boolean;
    dismissed_at?: number;
    satisfied_at?: number;
    project?: string;
    user?: string;
    station?: string;
    actions?: string;
}

type ActionParameters = ActionContext<NotificationsState, never>;

const getters = {
    notificationByKey: (state: NotificationsState) => (key) => {
        return state.notifications.filter((item) => item.key === key);
    },
};

const actions = (services: ServiceRef) => {
    return {
        [ActionTypes.LOAD]: ({ dispatch }: ActionParameters) => {
            return dispatch(ActionTypes.LOAD_NOTIFICATIONS);
        },
        [ActionTypes.LOAD_NOTIFICATIONS]: ({ commit, dispatch, state }: ActionParameters) => {
            return services
                .db()
                .getAllNotifications()
                .then((notifications) => {
                    commit(MutationTypes.LOAD_NOTIFICATIONS, notifications);
                })
                .catch((e) => console.log(ActionTypes.LOAD_NOTIFICATIONS, e));
        },
        [ActionTypes.ADD_NOTIFICATION]: ({ dispatch }: ActionParameters, notification) => {
            return services
                .db()
                .addNotification(notification)
                .then((res) => dispatch(ActionTypes.LOAD_NOTIFICATIONS).then(() => res))
                .catch((e) => console.log(ActionTypes.ADD_NOTIFICATION, e));
        },
        [ActionTypes.UPDATE_NOTIFICATION]: ({ dispatch }: ActionParameters, notification) => {
            return services
                .db()
                .updateNotification(notification)
                .then((res) => dispatch(ActionTypes.LOAD_NOTIFICATIONS).then(() => res))
                .catch((e) => console.log(ActionTypes.UPDATE_NOTIFICATION, e));
        },
        [ActionTypes.DISMISS_NOTIFICATION]: (
            { commit, dispatch, state }: ActionParameters,
            payload: { key: string; silenced: boolean }
        ) => {
            const notification: Notification = {
                ...state.notifications.find((item) => item.key === payload.key),
                key: payload.key,
                silenced: payload.silenced,
                dismissed_at: Number(new Date()),
            };

            return services
                .db()
                .updateNotification(notification)
                .then((res) => dispatch(ActionTypes.LOAD_NOTIFICATIONS).then(() => res))
                .catch((e) => console.log(ActionTypes.DISMISS_NOTIFICATION, e));
        },
        [ActionTypes.SATISFY_NOTIFICATION]: ({ commit, dispatch, state }: ActionParameters, payload: { key: string }) => {
            const notification: Notification = {
                ...state.notifications.find((item) => item.key === payload.key),
                key: payload.key,
                dismissed_at: Number(new Date()),
            };

            return services
                .db()
                .updateNotification(notification)
                .then((res) => dispatch(ActionTypes.LOAD_NOTIFICATIONS).then(() => res))
                .catch((e) => console.log(ActionTypes.SATISFY_NOTIFICATION, e));
        },
    };
};

const mutations = {
    [MutationTypes.LOAD_NOTIFICATIONS]: (state: NotificationsState, items: NotificationsTableRow) => {
        Vue.set(state, "notifications", items);
    },
};

export const notifications = (services: ServiceRef) => {
    const state = () => new NotificationsState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
