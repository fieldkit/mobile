import { Application } from "@nativescript/core";
let softKeyboardCallback = null;
Application.ios.addNotificationObserver(UIKeyboardDidShowNotification, (event) => {
    const height = event.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey).CGRectValue.size.height.toString();
    if (softKeyboardCallback !== null) {
        softKeyboardCallback(height);
    }
});
Application.ios.addNotificationObserver(UIKeyboardDidHideNotification, (event) => {
    if (softKeyboardCallback !== null) {
        softKeyboardCallback(0);
    }
});
export function registerSoftKeyboardCallback(callback) {
    softKeyboardCallback = callback;
}
//# sourceMappingURL=index.ios.js.map
