import Vue from "vue";
import { ActionContext, Module } from "vuex";
import { ActionTypes } from "../actions";
import { MutationTypes } from "../mutations";
import { ServiceRef } from "@/services";
import { NotificationsTableRow } from "~/store/row-types";
import moment from "moment";
import Config from "@/config";

export class NotificationsState {
    notifications: Notification[] = [];
}

export interface Notification {
    id?: number;
    key: string;
    kind?: string;
    created?: number;
    silenced?: boolean;
    dismissedAt?: number | null;
    satisfiedAt?: number | null;
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
        [ActionTypes.LOAD]: async ({ dispatch }: ActionParameters) => {
            try {
                await dispatch(ActionTypes.LOAD_NOTIFICATIONS);
            } catch (error) {
                console.log(`error loading notifications:`, error);
            }
        },
        [ActionTypes.LOAD_NOTIFICATIONS]: async ({ commit, dispatch, state }: ActionParameters) => {
            const rawNotifications = await services.db().getAllNotifications();

            const notifications = await Promise.all(
                rawNotifications.map(async (item) => {
                    const dismissedPeriodMinutes = Config.beta ? 10 : 60 * 24 * 3;
                    if (!item.satisfiedAt && item.silenced) {
                        if (
                            !item.dismissedAt ||
                            (item.dismissedAt &&
                                moment().diff(moment(item.dismissedAt).add(dismissedPeriodMinutes, "minutes"), "minutes") >= 0)
                        ) {
                            item.silenced = false;
                            item.dismissedAt = null;

                            await services.db().updateNotification({ key: item.key, silenced: false, dismissedAt: null });

                            return item;
                        }
                    }

                    return item;
                })
            );

            return commit(MutationTypes.LOAD_NOTIFICATIONS, notifications);
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
                .then((res) => res)
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
                dismissedAt: Number(new Date()),
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
                satisfiedAt: Number(new Date()),
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

type ModuleType = Module<NotificationsState, never>;

export const notifications = (services: ServiceRef): ModuleType => {
    const state = () => new NotificationsState();

    return {
        namespaced: false,
        state,
        getters,
        actions: actions(services),
        mutations,
    };
};
