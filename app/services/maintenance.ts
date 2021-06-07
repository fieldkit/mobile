import { DatabaseInterface } from "@/services";
import { debug, rebaseAbsolutePath } from "@/lib";

export async function deleteMissingAssets(db: DatabaseInterface): Promise<void> {
    const allMedia = await db.getAllMedia();
    debug.log(`media: ${JSON.stringify(allMedia)}`);
    for (const media of allMedia) {
        const remade = rebaseAbsolutePath(media.path);
        debug.log(media, { remade: remade });
    }
    return;
}
