import _ from "lodash";
import { path, knownFolders } from "tns-core-modules/file-system";
import { getPathTimestamp } from "../utilities";
import { ImageSource } from "tns-core-modules/image-source";
import { IncomingImage, SavedImage } from "./types";

export default class ImagesSaver {
    public saveImage(incoming: IncomingImage): Promise<SavedImage> {
        const folder = knownFolders.documents().getFolder("media/images");
        const destination = path.join(folder.path, getPathTimestamp(new Date()) + ".jpg");
        console.log("saving", incoming, destination);
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
}
