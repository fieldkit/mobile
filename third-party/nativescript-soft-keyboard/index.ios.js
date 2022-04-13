import { Application } from '@nativescript/core';
let softKeyboardCallback = null;
Application.ios.addNotificationObserver(UIKeyboardDidShowNotification, (event) => {
    const height = event.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey).CGRectValue.size.height.toString();
    if (softKeyboardCallback !== null) {
        softKeyboardCallback(height);
    }
});
Application.ios.addNotificationObserver(UIKeyboardWillHideNotification, (event) => {
    const height = 0;
    if (softKeyboardCallback !== null) {
        softKeyboardCallback(height);
    }
});

export function registerSoftKeyboardCallback(callback) {
    softKeyboardCallback = callback;
}
//# sourceMappingURL=index.ios.js.map
