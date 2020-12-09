import { DatabaseInterface } from "@/services";
import { rebaseAbsolutePath } from "@/lib/fs";

export async function deleteMissingAssets(db: DatabaseInterface): Promise<void> {
    const allMedia = await db.getAllMedia();
    console.log(`media: ${JSON.stringify(allMedia)}`);
    for (const media of allMedia) {
        const remade = rebaseAbsolutePath(media.path);
        console.log(media, { remade: remade });
    }
    return;
}
