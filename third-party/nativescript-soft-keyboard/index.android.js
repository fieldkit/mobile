import { Application, Screen, AndroidApplication } from '@nativescript/core';
let softKeyboardCallback = null;
let softKeyboardProvider = null;
Application.android.on(AndroidApplication.activityCreatedEvent, (args) => {
    softKeyboardProvider = new com.hold1.keyboardheightprovider.KeyboardHeightProvider(args.activity);
    const listener = new com.hold1.keyboardheightprovider.KeyboardHeightProvider.KeyboardListener({
        onHeightChanged: (height) => {
            if (softKeyboardCallback) {
                softKeyboardCallback(height / Screen.mainScreen.scale);
            }
        }
    });
    softKeyboardProvider.addKeyboardListener(listener);
});
Application.android.on(AndroidApplication.activityPausedEvent, () => {
    if (softKeyboardProvider) {
        softKeyboardProvider.onPause();
    }
});
Application.android.on(AndroidApplication.activityResumedEvent, () => {
    if (softKeyboardProvider) {
        softKeyboardProvider.onResume();
    }
});
export function registerSoftKeyboardCallback(callback) {
    softKeyboardCallback = callback;
}
//# sourceMappingURL=index.android.js.map