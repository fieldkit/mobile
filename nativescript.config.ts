import { NativeScriptConfig } from "@nativescript/core";

export default {
    id: "org.fieldkit.fieldkit",
    appResourcesPath: "App_Resources",
    android: {
        v8Flags: "--expose_gc",
        markingMode: "none",
        maxLogcatObjectSize: 65536,
    },
    discardUncaughtJsExceptions: false,
    appPath: "app",
} as NativeScriptConfig;
