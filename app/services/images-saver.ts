import { OurStore, MutationTypes } from "@/store";

import { ImageSource, path, knownFolders } from "@nativescript/core";
import * as ImagePicker from "@nativescript/imagepicker";
import * as Camera from "@nativescript/camera";

import { getPathTimestamp } from "@/lib/fs";
import { ImageAsset, IncomingImage, SavedImage } from "./types";

export default class ImagesSaver {
    constructor(private readonly store: OurStore) {}

    public saveImage(incoming: IncomingImage): Promise<SavedImage> {
        const folder = knownFolders.documents().getFolder("media/images");
        const destination = path.join(folder.path, getPathTimestamp(new Date()) + ".jpg");
        console.log("saving", incoming, destination);
        // eslint-disable-next-line
        return ImageSource.fromAsset(incoming.asset as any).then((imageSource) => {
            console.log("saving, have source", imageSource, destination);
            if (!imageSource.saveToFile(destination, "jpg")) {
                console.log("saving, failed", destination);
                throw new Error("save failed");
            }
            return new SavedImage(destination, imageSource, incoming.asset);
        });
    }

    public fromFile(path: string): Promise<SavedImage> {
        return ImageSource.fromFile(path).then((source) => {
            return new SavedImage(path, source, null);
        });
    }

    public findPicture(): Promise<SavedImage> {
        const context = ImagePicker.create({
            mode: "single",
        });

        return context
            .authorize()
            .then(() => context.present())
            .then((assets: ImageAsset[]) => this.savePicture(assets[0]));
    }

    public takePicture(): Promise<SavedImage> {
        return Camera.takePicture({
            keepAspectRatio: true,
            saveToGallery: true,
            allowsEditing: false,
        }).then((asset) => this.savePicture(asset));
    }

    private savePicture(asset: ImageAsset): Promise<SavedImage> {
        return this.saveImage(new IncomingImage(asset)).then((saved: SavedImage) => {
            this.store.commit(MutationTypes.CACHE_PHOTO, saved);
            return saved;
        });
    }
}
