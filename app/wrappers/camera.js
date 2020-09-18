if (TNS_ENV === "test") {
    module.exports = {
        takePicture: () => {
            throw new Error();
        },
        findPicture: () => {},
    };
} else {
    // import { isAvailable, requestCameraPermissions, takePicture } from '@nativescript/camera';
    const NativeCamera = require("@nativescript/camera");
    const ImagePicker = require("@nativescript/imagepicker");

    module.exports = {
        takePicture: (options) => {
            return NativeCamera.requestCameraPermissions().then(() => {
                return NativeCamera.takePicture(options);
            });
        },
        findPicture: () => {
            const context = ImagePicker.create({
                mode: "single",
            });

            return context.authorize().then(() => {
                return context.present();
            });
        },
    };
}
