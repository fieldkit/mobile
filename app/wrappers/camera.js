if (TNS_ENV === "test") {
    module.exports = {
        takePicture: () => {
            throw new Error();
        },
        findPicture: () => {},
    };
} else {
    const NativeCamera = require("nativescript-camera");
    const ImagePicker = require("nativescript-imagepicker");

    module.exports = {
        takePicture: options => {
            return NativeCamera.requestPermissions().then(() => {
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
