import Vue from "nativescript-vue";

const bus = new Vue();

export function getBus(): Vue {
    return bus;
}
