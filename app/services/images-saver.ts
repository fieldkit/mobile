import { OurStore, MutationTypes } from "@/store";

import { ImageSource, path, knownFolders } from "@nativescript/core";
import * as ImagePicker from "@nativescript/imagepicker";
import * as Camera from "@nativescript/camera";

import { getPathTimestamp } from "@/lib/fs";
import { ImageAsset, IncomingImage, SavedImage } from "./types";

export default class ImagesSaver {
    constructor(private readonly store: OurStore) {}

    public async saveImage(incoming: IncomingImage): Promise<SavedImage> {
        const folder = knownFolders.documents().getFolder("media/images");
        const destination = path.join(folder.path, getPathTimestamp(new Date()) + ".jpg");
        console.log("saving", incoming, destination);
        // eslint-disable-next-line
        return await ImageSource.fromAsset(incoming.asset as any).then((imageSource) => {
            console.log("saving image. source:", imageSource, "destination:", destination);
            if (!imageSource.saveToFile(destination, "jpg")) {
                console.log("saving failed. destination:", destination);
                throw new Error("save failed");
            }
            return new SavedImage(destination, imageSource, incoming.asset);
        });
    }

    public async fromFile(path: string): Promise<SavedImage> {
        return await ImageSource.fromFile(path).then((source) => {
            return new SavedImage(path, source, null);
        });
    }

    public async findPicture(): Promise<SavedImage> {
        const context = ImagePicker.create({
            mode: "single",
        });

        await Camera.requestPhotosPermissions();

        return await context
            .authorize()
            .then(() => context.present())
            .then((assets: ImageAsset[]) => this.savePicture(assets[0]));
    }

    public async takePicture(): Promise<SavedImage> {
        await Camera.requestCameraPermissions();

        const asset = await Camera.takePicture({
            keepAspectRatio: true,
            saveToGallery: true,
            allowsEditing: false,
        });

        return await this.savePicture(asset);
    }

    private async savePicture(asset: ImageAsset): Promise<SavedImage> {
        const saved = await this.saveImage(new IncomingImage(asset));
        this.store.commit(MutationTypes.CACHE_PHOTO, saved);
        return saved;
    }
}
